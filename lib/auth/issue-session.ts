import { NextResponse } from "next/server";
import { COOKIE_NAME, MAX_AGE_SECONDS, createSessionToken } from "@/lib/auth/session";

/** Shared by /api/auth/login and /api/auth/signup — issues the signed session cookie on a response. */
export async function attachSessionCookie(
  response: NextResponse,
  user: { id: string; tokenVersion: number },
): Promise<NextResponse> {
  const token = await createSessionToken({ userId: user.id, tokenVersion: user.tokenVersion });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}
