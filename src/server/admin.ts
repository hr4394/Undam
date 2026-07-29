import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "undam_admin";

function adminCookieValue(): string {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  const secret = process.env.TOKEN_HASH_SECRET ?? "dev";
  return createHmac("sha256", secret).update(`admin:${pw}`).digest("hex");
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const v = store.get(COOKIE)?.value;
  if (!v) return false;
  const expected = adminCookieValue();
  const a = Buffer.from(v);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setAdminCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, adminCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 8,
  });
}

export function checkAdminPassword(pw: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const a = Buffer.from(pw);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
