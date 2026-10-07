import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getCurrentUser } from "@/lib/auth/current-user";
import { encryptToken } from "@/lib/security/token-crypto";
import { SITE_URL } from "@/lib/site-url";

const PENDING_COOKIE = "threads_oauth_pending";
const SCOPE = "threads_basic,threads_content_publish";

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // A separate app credential pair from Instagram's — Meta issues one per
  // product even within the same app, and Threads' endpoints reject the
  // wrong pair outright.
  const clientId = process.env.THREADS_APP_ID;
  const clientSecret = process.env.THREADS_APP_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/settings?threads_error=not_configured", request.url));
  }

  const callbackUrl = new URL("/api/connections/threads/callback", SITE_URL).toString();
  const state = base64url(randomBytes(24));

  const authorizeUrl = new URL("https://threads.com/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", SCOPE);
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl.toString());
  response.cookies.set(
    PENDING_COOKIE,
    encryptToken(JSON.stringify({ accountId: currentUser.accountId, state, callbackUrl })),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    },
  );
  return response;
}
