import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { encryptToken, decryptToken } from "@/lib/security/token-crypto";
import { withIpRateLimit } from "@/lib/auth/with-auth";
import { instagramCallbackLimiter } from "@/lib/redis/rate-limit";

const PENDING_COOKIE = "instagram_oauth_pending";

interface PendingHandshake {
  accountId: string;
  state: string;
  callbackUrl: string;
}

// Public redirect target — the user's own browser lands here after
// authorizing on Instagram's side, carrying their existing Orbit session
// cookie along with it (same browser, same cookie jar) — proxy.ts's cheap
// presence check already passes on that alone, same as the X callback.
// Rate-limited by IP regardless, since this accepts client-controlled
// code/state query params with no other guard against abuse.
export const GET = withIpRateLimit(instagramCallbackLimiter, async (request: NextRequest) => {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const pendingCookie = request.cookies.get(PENDING_COOKIE)?.value;

  if (!code || !state || !pendingCookie) {
    return NextResponse.redirect(new URL("/settings?instagram_error=missing_params", request.url));
  }

  let pending: PendingHandshake;
  try {
    pending = JSON.parse(decryptToken(pendingCookie));
  } catch {
    return NextResponse.redirect(new URL("/settings?instagram_error=expired", request.url));
  }

  if (pending.state !== state) {
    return NextResponse.redirect(new URL("/settings?instagram_error=token_mismatch", request.url));
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/settings?instagram_error=not_configured", request.url));
  }

  try {
    // Step 1: code -> short-lived token. This specific endpoint wants
    // form-encoded body, not JSON, and wraps its response in a `data` array
    // — both confirmed against Meta's current docs, not the usual OAuth2 shape.
    const shortLivedRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: pending.callbackUrl,
        code,
      }),
    });
    const shortLivedBody = await shortLivedRes.json().catch(() => null);
    const shortLivedToken = shortLivedBody?.data?.[0]?.access_token;
    if (!shortLivedRes.ok || typeof shortLivedToken !== "string") {
      throw new Error(`Code exchange failed: ${JSON.stringify(shortLivedBody)}`);
    }

    // Step 2: short-lived -> long-lived (60-day) token.
    const longLivedUrl = new URL("https://graph.instagram.com/access_token");
    longLivedUrl.searchParams.set("grant_type", "ig_exchange_token");
    longLivedUrl.searchParams.set("client_secret", clientSecret);
    longLivedUrl.searchParams.set("access_token", shortLivedToken);
    const longLivedRes = await fetch(longLivedUrl.toString());
    const longLivedBody = await longLivedRes.json().catch(() => null);
    const longLivedToken = longLivedBody?.access_token;
    const expiresInSeconds = longLivedBody?.expires_in;
    if (!longLivedRes.ok || typeof longLivedToken !== "string" || typeof expiresInSeconds !== "number") {
      throw new Error(`Long-lived token exchange failed: ${JSON.stringify(longLivedBody)}`);
    }

    // Step 3: who is this, for display in Settings.
    const meUrl = new URL("https://graph.instagram.com/me");
    meUrl.searchParams.set("fields", "id,username");
    meUrl.searchParams.set("access_token", longLivedToken);
    const meRes = await fetch(meUrl.toString());
    const meBody = await meRes.json().catch(() => null);
    if (!meRes.ok || typeof meBody?.id !== "string" || typeof meBody?.username !== "string") {
      throw new Error(`Profile fetch failed: ${JSON.stringify(meBody)}`);
    }

    // Instagram's long-lived token has no separate refresh token — the
    // access token itself is what gets refreshed (graph.instagram.com/
    // refresh_access_token, see lib/publishing/instagram-client.ts).
    // refreshToken is non-nullable on this shared table (built for X's real
    // OAuth2 refresh token), so it just mirrors accessToken here rather than
    // needing a schema change for a concept Instagram doesn't have.
    const encryptedToken = encryptToken(longLivedToken);
    await prisma.accountSocialToken.upsert({
      where: { accountId_platform: { accountId: pending.accountId, platform: "INSTAGRAM" } },
      update: {
        accessToken: encryptedToken,
        refreshToken: encryptedToken,
        tokenExpiresAt: new Date(Date.now() + expiresInSeconds * 1000),
        externalUserId: meBody.id,
        externalUsername: meBody.username,
      },
      create: {
        accountId: pending.accountId,
        platform: "INSTAGRAM",
        accessToken: encryptedToken,
        refreshToken: encryptedToken,
        tokenExpiresAt: new Date(Date.now() + expiresInSeconds * 1000),
        externalUserId: meBody.id,
        externalUsername: meBody.username,
      },
    });

    const response = NextResponse.redirect(new URL("/settings?instagram_connected=1", request.url));
    response.cookies.delete(PENDING_COOKIE);
    return response;
  } catch (err) {
    console.error("Instagram OAuth callback failed:", err);
    const response = NextResponse.redirect(
      new URL(`/settings?instagram_error=${encodeURIComponent(String(err))}`, request.url),
    );
    response.cookies.delete(PENDING_COOKIE);
    return response;
  }
});
