import { NextRequest, NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { getCurrentUser } from "@/lib/auth/current-user";
import { encryptToken } from "@/lib/security/token-crypto";

const PENDING_COOKIE = "x_oauth_pending";

// Kicks off X's 3-legged OAuth 1.0a flow. Requires this route's own URL to
// be in the app's approved callback URLs in the X Developer Portal (User
// authentication settings) — otherwise X rejects the request-token call
// with a 415 before this ever redirects anywhere.
export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const appKey = process.env.X_API_KEY;
  const appSecret = process.env.X_API_SECRET;
  if (!appKey || !appSecret) {
    return NextResponse.redirect(new URL("/settings?x_error=not_configured", request.url));
  }

  const callbackUrl = new URL("/api/connections/x/callback", request.url).toString();

  try {
    const client = new TwitterApi({ appKey, appSecret });
    const { url, oauth_token, oauth_token_secret } = await client.generateAuthLink(callbackUrl, {
      authAccessType: "write",
    });

    const response = NextResponse.redirect(url);
    // Short-lived, encrypted — OAuth 1.0a needs the request token's secret
    // back at the callback step, and there's no other place to hold it
    // between these two requests than the visitor's own browser.
    response.cookies.set(
      PENDING_COOKIE,
      encryptToken(JSON.stringify({ accountId: currentUser.accountId, oauth_token, oauth_token_secret })),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      },
    );
    return response;
  } catch (err) {
    return NextResponse.redirect(
      new URL(`/settings?x_error=${encodeURIComponent(String(err))}`, request.url),
    );
  }
}
