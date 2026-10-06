import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { BUCKET, db, isContentTable } from "@/lib/supabase-server";
import type { CardElement } from "@/lib/media";

// Изменить пометки: reviewed (просмотрено) и hidden (скрыто от Сони)
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!isContentTable(body?.table) || typeof body?.id !== "string") {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const patch: Record<string, boolean> = {};
  if (typeof body.reviewed === "boolean") patch.reviewed = body.reviewed;
  if (typeof body.hidden === "boolean") patch.hidden = body.hidden;

  const { error } = await db().from(body.table).update(patch).eq("id", body.id);
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Удалить запись вместе с её файлами
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!isContentTable(body?.table) || typeof body?.id !== "string") {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const { data: row } = await db().from(body.table).select("*").eq("id", body.id).maybeSingle();
  if (row) {
    const paths: string[] = [];
    if (typeof row.path === "string") paths.push(row.path);
    if (Array.isArray(row.elements)) {
      (row.elements as CardElement[]).forEach((e) => {
        if (e.kind === "photo") paths.push(e.src);
        if (e.kind === "frame" && e.photo) paths.push(e.photo);
      });
    }
    if (paths.length) await db().storage.from(BUCKET).remove(paths);
  }

  const { error } = await db().from(body.table).delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
