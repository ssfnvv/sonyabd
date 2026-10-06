import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Финал: видео для трейлера и предсказания для баночки (только не скрытые)
export async function GET() {
  const [videos, preds] = await Promise.all([
    db().from("videos").select("id, path, mime, friends(name)").eq("hidden", false).order("created_at"),
    db().from("predictions").select("id, text, friends(name)").eq("hidden", false).order("created_at"),
  ]);
  if (videos.error || preds.error) return NextResponse.json({ error: "db" }, { status: 500 });

  const nameOf = (f: unknown) => (f as { name: string } | null)?.name ?? "";
  return NextResponse.json(
    {
      videos: (videos.data ?? []).map((v) => ({ id: v.id, path: v.path, mime: v.mime, name: nameOf(v.friends) })),
      predictions: (preds.data ?? []).map((p) => ({ id: p.id, text: p.text, name: nameOf(p.friends) })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
