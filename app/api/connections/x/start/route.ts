import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { getCurrentUser } from "@/lib/auth/current-user";
import { encryptToken } from "@/lib/security/token-crypto";

const PENDING_COOKIE = "x_oauth_pending";
const SCOPE = "tweet.read tweet.write users.read offline.access";

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// twitter-api-v2's generateOAuth2AuthLink() hardcodes code_challenge_method
// as lowercase "s256", but RFC 7636 defines the value as the literal string
// "S256" and X's authorization server checks it case-sensitively — sending
// "s256" produces exactly the generic "Something went wrong" error at the
// authorize step, not a clear one. Built by hand here to get the casing
// right; the token-exchange step (loginWithOAuth2) doesn't care about this
// value at all, only the codeVerifier, so the SDK is still used for that.
function generatePkcePair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = base64url(randomBytes(32));
  const codeChallenge = base64url(createHash("sha256").update(codeVerifier).digest());
  return { codeVerifier, codeChallenge };
}

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
  const { codeVerifier, codeChallenge } = generatePkcePair();
  const state = base64url(randomBytes(24));

  const authorizeUrl = new URL("https://x.com/i/oauth2/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl);
  authorizeUrl.searchParams.set("scope", SCOPE);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizeUrl.toString());
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
}
