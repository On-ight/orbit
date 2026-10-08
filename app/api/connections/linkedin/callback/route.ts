import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { encryptToken, decryptToken } from "@/lib/security/token-crypto";
import { withIpRateLimit } from "@/lib/auth/with-auth";
import { linkedinCallbackLimiter } from "@/lib/redis/rate-limit";

const PENDING_COOKIE = "linkedin_oauth_pending";

interface PendingHandshake {
  accountId: string;
  state: string;
  callbackUrl: string;
}

// Public redirect target — same reasoning as the other platforms' callbacks:
// the user's own browser carries their existing Orbit session cookie here.
export const GET = withIpRateLimit(linkedinCallbackLimiter, async (request: NextRequest) => {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const pendingCookie = request.cookies.get(PENDING_COOKIE)?.value;

  if (!code || !state || !pendingCookie) {
    return NextResponse.redirect(new URL("/settings?linkedin_error=missing_params", request.url));
  }

  let pending: PendingHandshake;
  try {
    pending = JSON.parse(decryptToken(pendingCookie));
  } catch {
    return NextResponse.redirect(new URL("/settings?linkedin_error=expired", request.url));
  }

  if (pending.state !== state) {
    return NextResponse.redirect(new URL("/settings?linkedin_error=token_mismatch", request.url));
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/settings?linkedin_error=not_configured", request.url));
  }

  try {
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: pending.callbackUrl,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    const tokenBody = await tokenRes.json().catch(() => null);
    const accessToken = tokenBody?.access_token;
    const expiresIn = tokenBody?.expires_in;
    if (!tokenRes.ok || typeof accessToken !== "string" || typeof expiresIn !== "number") {
      throw new Error(`Token exchange failed: ${JSON.stringify(tokenBody)}`);
    }
    // Self-serve apps (no Marketing Developer Platform approval) don't get
    // a programmatic refresh_token back — intentionally not read/stored
    // here. See lib/publishing/linkedin-client.ts's getLinkedInAuth.

    const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const meBody = await meRes.json().catch(() => null);
    if (!meRes.ok || typeof meBody?.sub !== "string") {
      throw new Error(`Profile fetch failed: ${JSON.stringify(meBody)}`);
    }
    const displayName = typeof meBody?.name === "string" ? meBody.name : "your account";

    const encryptedToken = encryptToken(accessToken);
    await prisma.accountSocialToken.upsert({
      where: { accountId_platform: { accountId: pending.accountId, platform: "LINKEDIN" } },
      update: {
        accessToken: encryptedToken,
        refreshToken: encryptedToken,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        externalUserId: meBody.sub,
        externalUsername: displayName,
      },
      create: {
        accountId: pending.accountId,
        platform: "LINKEDIN",
        accessToken: encryptedToken,
        refreshToken: encryptedToken,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        externalUserId: meBody.sub,
        externalUsername: displayName,
      },
    });

    const response = NextResponse.redirect(new URL("/settings?linkedin_connected=1", request.url));
    response.cookies.delete(PENDING_COOKIE);
    return response;
  } catch (err) {
    console.error("LinkedIn OAuth callback failed:", err);
    const response = NextResponse.redirect(
      new URL(`/settings?linkedin_error=${encodeURIComponent(String(err))}`, request.url),
    );
    response.cookies.delete(PENDING_COOKIE);
    return response;
  }
});
