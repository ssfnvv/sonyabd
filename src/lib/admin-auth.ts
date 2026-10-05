import "server-only";
import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";

// В cookie храним не сам пароль, а его хэш с солью
export function adminToken(): string {
  const pass = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update(`sonya-admin:${pass}`).digest("hex");
}

export function checkPassword(input: string): boolean {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return false;
  const a = Buffer.from(createHash("sha256").update(input).digest("hex"));
  const b = Buffer.from(createHash("sha256").update(pass).digest("hex"));
  return timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value === adminToken();
}
