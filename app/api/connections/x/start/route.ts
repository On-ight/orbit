import { NextRequest, NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { getCurrentUser } from "@/lib/auth/current-user";
import { encryptToken } from "@/lib/security/token-crypto";

const PENDING_COOKIE = "x_oauth_pending";

// Kicks off X's OAuth 2.0 Authorization Code Flow with PKCE. Requires this
// route's own URL to be an approved callback URL under the app's OAuth 2.0
// settings in the X Developer Portal (User authentication settings) —
// otherwise X rejects the redirect before the user ever sees an
// authorization screen.
export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/settings?x_error=not_configured", request.url));
  }

  const callbackUrl = new URL("/api/connections/x/callback", request.url).toString();

  try {
    const client = new TwitterApi({ clientId, clientSecret });
    const { url, state, codeVerifier } = client.generateOAuth2AuthLink(callbackUrl, {
      scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    });

    const response = NextResponse.redirect(url);
    // Short-lived, encrypted — PKCE needs the code verifier back at the
    // callback step, and `state` guards against CSRF; there's nowhere else
    // to hold either between these two requests than the visitor's browser.
    response.cookies.set(
      PENDING_COOKIE,
      encryptToken(JSON.stringify({ accountId: currentUser.accountId, state, codeVerifier, callbackUrl })),
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
