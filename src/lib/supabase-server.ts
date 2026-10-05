import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Серверный клиент с service-ключом: обходит RLS, поэтому живёт ТОЛЬКО на сервере.
let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars are missing");
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export const BUCKET = "media";

// Таблицы с контентом, которые можно модерировать
export const CONTENT_TABLES = ["timeline", "audios", "quiz", "predictions", "videos"] as const;
export type ContentTable = (typeof CONTENT_TABLES)[number];

export function isContentTable(t: unknown): t is ContentTable {
  return typeof t === "string" && (CONTENT_TABLES as readonly string[]).includes(t);
}

// Проверяем, что друг существует (защита от мусорных friendId)
export async function friendExists(friendId: unknown): Promise<boolean> {
  if (typeof friendId !== "string" || !/^[0-9a-f-]{36}$/i.test(friendId)) return false;
  const { data } = await db().from("friends").select("id").eq("id", friendId).maybeSingle();
  return Boolean(data);
}

// Файл должен лежать в папке этого друга — нельзя подсунуть чужой путь
export function ownsPath(friendId: string, path: unknown): path is string {
  return typeof path === "string" && path.startsWith(`${friendId}/`) && !path.includes("..");
}
