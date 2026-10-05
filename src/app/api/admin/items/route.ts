import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { CONTENT_TABLES, db } from "@/lib/supabase-server";

// Весь контент разом, с именами друзей. Новые сверху.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "auth" }, { status: 401 });

  const results = await Promise.all(
    CONTENT_TABLES.map((t) =>
      db().from(t).select("*, friends(name)").order("created_at", { ascending: false }),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed) return NextResponse.json({ error: "db" }, { status: 500 });

  const out: Record<string, unknown[]> = {};
  CONTENT_TABLES.forEach((t, i) => (out[t] = results[i].data ?? []));
  return NextResponse.json(out);
}
