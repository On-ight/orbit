import { NextResponse } from "next/server";
import { COOKIE_NAME, MAX_AGE_SECONDS, createSessionCookie } from "@/lib/auth/session";

/** Shared by /api/auth/session — issues the signed Firebase session cookie on a response. */
export async function attachSessionCookie(response: NextResponse, idToken: string): Promise<NextResponse> {
  const cookie = await createSessionCookie(idToken);
  response.cookies.set(COOKIE_NAME, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}
