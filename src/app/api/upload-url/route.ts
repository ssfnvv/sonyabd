import { NextResponse } from "next/server";
import { BUCKET, db, friendExists } from "@/lib/supabase-server";

// Выдаёт одноразовую ссылку для загрузки файла прямо в хранилище.
// Файл идёт из браузера в Supabase напрямую, минуя Vercel (там лимит 4.5 МБ на запрос).
const ALLOWED_EXT: Record<string, string[]> = {
  photo: ["jpg"],
  audio: ["webm", "mp4", "m4a", "ogg", "aac"],
  video: ["webm", "mp4", "mov"],
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { friendId, kind, ext } = body ?? {};

  if (!(await friendExists(friendId))) return NextResponse.json({ error: "friend" }, { status: 403 });
  if (typeof kind !== "string" || !ALLOWED_EXT[kind]?.includes(ext)) {
    return NextResponse.json({ error: "type" }, { status: 400 });
  }

  const path = `${friendId}/${kind}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await db().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: "storage" }, { status: 500 });

  return NextResponse.json({ path: data.path, token: data.token });
}
