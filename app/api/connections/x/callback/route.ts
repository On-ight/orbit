import { NextRequest, NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { prisma } from "@/lib/db/prisma";
import { encryptToken, decryptToken } from "@/lib/security/token-crypto";

const PENDING_COOKIE = "x_oauth_pending";

interface PendingHandshake {
  accountId: string;
  state: string;
  codeVerifier: string;
  callbackUrl: string;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const pendingCookie = request.cookies.get(PENDING_COOKIE)?.value;

  if (!code || !state || !pendingCookie) {
    return NextResponse.redirect(new URL("/settings?x_error=missing_params", request.url));
  }

  let pending: PendingHandshake;
  try {
    pending = JSON.parse(decryptToken(pendingCookie));
  } catch {
    return NextResponse.redirect(new URL("/settings?x_error=expired", request.url));
  }

  // The state returned by X must match the one we issued — otherwise this
  // isn't the handshake we started (CSRF guard).
  if (pending.state !== state) {
    return NextResponse.redirect(new URL("/settings?x_error=token_mismatch", request.url));
  }

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/settings?x_error=not_configured", request.url));
  }

  try {
    const client = new TwitterApi({ clientId, clientSecret });
    const {
      client: loggedClient,
      accessToken,
      refreshToken,
      expiresIn,
    } = await client.loginWithOAuth2({ code, codeVerifier: pending.codeVerifier, redirectUri: pending.callbackUrl });

    if (!refreshToken) {
      // Shouldn't happen given offline.access was requested, but a token we
      // can't ever refresh isn't safe to treat as a working connection.
      throw new Error("No refresh token returned — offline.access scope may not have been granted");
    }

    const me = await loggedClient.v2.me();

    const data = {
      accessToken: encryptToken(accessToken),
      refreshToken: encryptToken(refreshToken),
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      externalUserId: me.data.id,
      externalUsername: me.data.username,
    };

    await prisma.accountSocialToken.upsert({
      where: { accountId_platform: { accountId: pending.accountId, platform: "X" } },
      update: data,
      create: { accountId: pending.accountId, platform: "X", ...data },
    });

    const response = NextResponse.redirect(new URL("/settings?x_connected=1", request.url));
    response.cookies.delete(PENDING_COOKIE);
    return response;
  } catch (err) {
    const response = NextResponse.redirect(
      new URL(`/settings?x_error=${encodeURIComponent(String(err))}`, request.url),
    );
    response.cookies.delete(PENDING_COOKIE);
    return response;
  }
}
