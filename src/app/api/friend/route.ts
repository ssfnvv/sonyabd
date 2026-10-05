import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-server";

// Регистрация друга по имени. Возвращает id, который браузер запоминает.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 60) : "";
  if (!name) return NextResponse.json({ error: "name" }, { status: 400 });

  const { data, error } = await db().from("friends").insert({ name }).select("id, name").single();
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json(data);
}
