import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE_NAME, getAdminSessionCookieOptions } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
    ...getAdminSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
