import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Карточки для акта 2: только не скрытые, по годам, внутри года — по времени загрузки
export async function GET() {
  const { data, error } = await db()
    .from("timeline")
    .select("id, year, story, elements, created_at, friends(name)")
    .eq("hidden", false)
    .order("year", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });

  const cards = (data ?? []).map((r) => ({
    id: r.id,
    year: r.year,
    story: r.story,
    elements: r.elements,
    name: (r.friends as unknown as { name: string } | null)?.name ?? "",
  }));
  return NextResponse.json(cards, { headers: { "Cache-Control": "no-store" } });
}
