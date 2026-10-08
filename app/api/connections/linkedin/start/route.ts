import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getCurrentUser } from "@/lib/auth/current-user";
import { encryptToken } from "@/lib/security/token-crypto";
import { SITE_URL } from "@/lib/site-url";

const PENDING_COOKIE = "linkedin_oauth_pending";
// openid+profile: identity (Sign In with LinkedIn using OpenID Connect).
// w_member_social: posting (Share on LinkedIn). Both self-serve products.
const SCOPE = "openid profile w_member_social";

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/settings?linkedin_error=not_configured", request.url));
  }

  const callbackUrl = new URL("/api/connections/linkedin/callback", SITE_URL).toString();
  const state = base64url(randomBytes(24));

  const authorizeUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl);
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
