import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getCurrentUser } from "@/lib/auth/current-user";
import { encryptToken } from "@/lib/security/token-crypto";
import { SITE_URL } from "@/lib/site-url";

const PENDING_COOKIE = "instagram_oauth_pending";
// instagram_business_basic: read the connected profile (id/username).
// instagram_business_content_publish: the actual publish permission.
const SCOPE = "instagram_business_basic,instagram_business_content_publish";

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/settings?instagram_error=not_configured", request.url));
  }

  // Fixed to the canonical site origin, not request.url — same reasoning as
  // the X connect flow: the registered redirect_uri must match exactly.
  const callbackUrl = new URL("/api/connections/instagram/callback", SITE_URL).toString();
  const state = base64url(randomBytes(24));

  const authorizeUrl = new URL("https://www.instagram.com/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", SCOPE);
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl.toString());
  // Short-lived, encrypted — `state` guards against CSRF; there's nowhere
  // else to hold it between these two requests than the visitor's browser.
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
