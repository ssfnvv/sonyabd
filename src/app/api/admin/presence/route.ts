import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Кто был на сайте за последние 60 секунд
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "auth" }, { status: 401 });
  const since = new Date(Date.now() - 60_000).toISOString();
  const { data, error } = await db().from("presence").select("session_id, name, path, last_seen").gte("last_seen", since);
  if (error) return NextResponse.json({ error: "no_table" }, { status: 200 });
  return NextResponse.json({ online: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
