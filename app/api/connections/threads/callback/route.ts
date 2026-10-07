import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { encryptToken, decryptToken } from "@/lib/security/token-crypto";
import { withIpRateLimit } from "@/lib/auth/with-auth";
import { threadsCallbackLimiter } from "@/lib/redis/rate-limit";

const PENDING_COOKIE = "threads_oauth_pending";

interface PendingHandshake {
  accountId: string;
  state: string;
  callbackUrl: string;
}

// Public redirect target — same reasoning as the Instagram/X callbacks: the
// user's own browser carries their existing Orbit session cookie here, so
// proxy.ts's presence check already passes; rate-limited by IP regardless
// since this accepts client-controlled code/state query params.
export const GET = withIpRateLimit(threadsCallbackLimiter, async (request: NextRequest) => {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const pendingCookie = request.cookies.get(PENDING_COOKIE)?.value;

  if (!code || !state || !pendingCookie) {
    return NextResponse.redirect(new URL("/settings?threads_error=missing_params", request.url));
  }

  let pending: PendingHandshake;
  try {
    pending = JSON.parse(decryptToken(pendingCookie));
  } catch {
    return NextResponse.redirect(new URL("/settings?threads_error=expired", request.url));
  }

  if (pending.state !== state) {
    return NextResponse.redirect(new URL("/settings?threads_error=token_mismatch", request.url));
  }

  const clientId = process.env.THREADS_APP_ID;
  const clientSecret = process.env.THREADS_APP_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/settings?threads_error=not_configured", request.url));
  }

  try {
    // Step 1: code -> short-lived token.
    const shortLivedRes = await fetch("https://graph.threads.com/oauth/access_token", {
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
    const shortLivedToken = shortLivedBody?.access_token;
    const threadsUserId = shortLivedBody?.user_id;
    if (!shortLivedRes.ok || typeof shortLivedToken !== "string") {
      throw new Error(`Code exchange failed: ${JSON.stringify(shortLivedBody)}`);
    }

    // Step 2: short-lived -> long-lived (60-day) token.
    const longLivedUrl = new URL("https://graph.threads.com/access_token");
    longLivedUrl.searchParams.set("grant_type", "th_exchange_token");
    longLivedUrl.searchParams.set("client_secret", clientSecret);
    longLivedUrl.searchParams.set("access_token", shortLivedToken);
    const longLivedRes = await fetch(longLivedUrl.toString());
    const longLivedBody = await longLivedRes.json().catch(() => null);
    const longLivedToken = longLivedBody?.access_token;
    const expiresInSeconds = longLivedBody?.expires_in;
    if (!longLivedRes.ok || typeof longLivedToken !== "string" || typeof expiresInSeconds !== "number") {
      throw new Error(`Long-lived token exchange failed: ${JSON.stringify(longLivedBody)}`);
    }

    // Step 3: who is this, for display in Settings. user_id from step 1
    // already identifies the account; this just gets the username too.
    const meUrl = new URL("https://graph.threads.com/v1.0/me");
    meUrl.searchParams.set("fields", "id,username");
    meUrl.searchParams.set("access_token", longLivedToken);
    const meRes = await fetch(meUrl.toString());
    const meBody = await meRes.json().catch(() => null);
    const resolvedId = typeof meBody?.id === "string" ? meBody.id : threadsUserId;
    if (!meRes.ok || typeof resolvedId !== "string" || typeof meBody?.username !== "string") {
      throw new Error(`Profile fetch failed: ${JSON.stringify(meBody)}`);
    }

    // Threads' long-lived token has no separate refresh token, same as
    // Instagram — refreshToken mirrors accessToken on this shared table.
    const encryptedToken = encryptToken(longLivedToken);
    await prisma.accountSocialToken.upsert({
      where: { accountId_platform: { accountId: pending.accountId, platform: "THREADS" } },
      update: {
        accessToken: encryptedToken,
        refreshToken: encryptedToken,
        tokenExpiresAt: new Date(Date.now() + expiresInSeconds * 1000),
        externalUserId: resolvedId,
        externalUsername: meBody.username,
      },
      create: {
        accountId: pending.accountId,
        platform: "THREADS",
        accessToken: encryptedToken,
        refreshToken: encryptedToken,
        tokenExpiresAt: new Date(Date.now() + expiresInSeconds * 1000),
        externalUserId: resolvedId,
        externalUsername: meBody.username,
      },
    });

    const response = NextResponse.redirect(new URL("/settings?threads_connected=1", request.url));
    response.cookies.delete(PENDING_COOKIE);
    return response;
  } catch (err) {
    console.error("Threads OAuth callback failed:", err);
    const response = NextResponse.redirect(
      new URL(`/settings?threads_error=${encodeURIComponent(String(err))}`, request.url),
    );
    response.cookies.delete(PENDING_COOKIE);
    return response;
  }
});
