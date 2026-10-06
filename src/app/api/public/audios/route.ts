import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Голосовые для актов 3 и 4: /api/public/audios?type=diary|call|final (только не скрытые)
export async function GET(req: Request) {
  const type = new URL(req.url).searchParams.get("type");
  if (!["diary", "call", "final"].includes(type ?? "")) return NextResponse.json({ error: "type" }, { status: 400 });

  const { data, error } = await db()
    .from("audios")
    .select("id, path, mime, duration_sec, created_at, friends(name)")
    .eq("type", type)
    .eq("hidden", false)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });

  return NextResponse.json(
    (data ?? []).map((r) => ({
      id: r.id,
      path: r.path,
      mime: r.mime,
      duration: r.duration_sec,
      name: (r.friends as unknown as { name: string } | null)?.name ?? "",
    })),
    { headers: { "Cache-Control": "no-store" } },
  );
}
