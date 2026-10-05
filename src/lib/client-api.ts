"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Браузерный клиент с публичным ключом. Им только загружаем файлы по подписанным ссылкам —
// к таблицам у него доступа нет (RLS без политик).
let browserClient: SupabaseClient | null = null;
function storage() {
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      { auth: { persistSession: false } },
    );
  }
  return browserClient.storage.from("media");
}

export type Friend = { id: string; name: string };
const FRIEND_KEY = "sonya_friend";

export function loadFriend(): Friend | null {
  try {
    const raw = localStorage.getItem(FRIEND_KEY);
    return raw ? (JSON.parse(raw) as Friend) : null;
  } catch {
    return null;
  }
}

export function saveFriend(f: Friend) {
  try {
    localStorage.setItem(FRIEND_KEY, JSON.stringify(f));
  } catch {
    /* приватный режим — просто не запоминаем */
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const registerFriend = (name: string) => postJson<Friend>("/api/friend", { name });

export const submit = (kind: "card" | "audio" | "video" | "quiz" | "prediction", body: object) =>
  postJson<{ ok: true }>(`/api/submit/${kind}`, body);

// Загрузка файла: получаем подписанную ссылку у сервера, грузим напрямую в Supabase.
// Повторяем до 3 раз — мобильный интернет часто моргает.
export async function uploadFile(
  friendId: string,
  kind: "photo" | "audio" | "video",
  blob: Blob,
  ext: string,
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { path, token } = await postJson<{ path: string; token: string }>("/api/upload-url", {
        friendId,
        kind,
        ext,
      });
      const { error } = await storage().uploadToSignedUrl(path, token, blob, {
        contentType: blob.type || undefined,
      });
      if (error) throw error;
      return path;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  throw lastErr;
}

// Расширение файла по MIME-типу записи
export function extFromMime(mime: string, fallback: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("quicktime")) return "mov";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("aac")) return "aac";
  return fallback;
}
