import { NextResponse } from "next/server";
import { CONTENT_TABLES, db } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Викторина для акта 5: вопросы обоих раундов (не скрытые) + имена всех,
// кто что-то прислал, — из них берутся неверные варианты для раунда «кто это написал».
export async function GET() {
  const { data: quiz, error } = await db()
    .from("quiz")
    .select("id, round, fact, question, correct, wrong, friend_id, friends(name)")
    .eq("hidden", false);
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });

  const ids = new Set<string>();
  const lists = await Promise.all(CONTENT_TABLES.map((t) => db().from(t).select("friend_id").eq("hidden", false)));
  lists.forEach((r) => r.data?.forEach((x) => ids.add(x.friend_id as string)));
  const { data: friends } = ids.size
    ? await db().from("friends").select("id, name").in("id", [...ids])
    : { data: [] as { id: string; name: string }[] };

  // одинаковые имена (вдруг человек зашёл дважды) считаем одним
  const names = [...new Map((friends ?? []).map((f) => [f.name.trim().toLowerCase(), f.name.trim()])).values()];

  return NextResponse.json(
    {
      names,
      round1: (quiz ?? [])
        .filter((q) => q.round === 1)
        .map((q) => ({ id: q.id, text: q.fact, answer: (q.friends as unknown as { name: string } | null)?.name?.trim() ?? "" })),
      round2: (quiz ?? [])
        .filter((q) => q.round === 2)
        .map((q) => ({ id: q.id, text: q.question, answer: q.correct, wrong: q.wrong as string[] })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
