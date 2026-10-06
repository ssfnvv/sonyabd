import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-server";

// «Я здесь»: браузер присылает раз в ~20 секунд. Храним последнюю отметку на вкладку.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const sid = typeof body?.sid === "string" ? body.sid.slice(0, 64) : "";
  if (!/^[a-z0-9-]{8,64}$/i.test(sid)) return NextResponse.json({ ok: false }, { status: 400 });
  const path = typeof body?.path === "string" ? body.path.slice(0, 80) : "";
  let friendId: string | null = null;
  let name: string | null = null;
  if (typeof body?.friendId === "string" && /^[0-9a-f-]{36}$/i.test(body.friendId)) {
    const { data } = await db().from("friends").select("id, name").eq("id", body.friendId).maybeSingle();
    if (data) {
      friendId = data.id;
      name = data.name;
    }
  }
  await db()
    .from("presence")
    .upsert({ session_id: sid, friend_id: friendId, name, path, last_seen: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
