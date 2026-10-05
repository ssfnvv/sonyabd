import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken, checkPassword } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (typeof body?.password !== "string" || !checkPassword(body.password)) {
    return NextResponse.json({ error: "wrong" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}
