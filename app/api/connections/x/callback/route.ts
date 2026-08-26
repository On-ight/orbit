import { NextRequest, NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { prisma } from "@/lib/db/prisma";
import { encryptToken, decryptToken } from "@/lib/security/token-crypto";

const PENDING_COOKIE = "x_oauth_pending";

interface PendingHandshake {
  accountId: string;
  oauth_token: string;
  oauth_token_secret: string;
}

export async function GET(request: NextRequest) {
  const oauthToken = request.nextUrl.searchParams.get("oauth_token");
  const oauthVerifier = request.nextUrl.searchParams.get("oauth_verifier");
  const pendingCookie = request.cookies.get(PENDING_COOKIE)?.value;

  if (!oauthToken || !oauthVerifier || !pendingCookie) {
    return NextResponse.redirect(new URL("/settings?x_error=missing_params", request.url));
  }

  let pending: PendingHandshake;
  try {
    pending = JSON.parse(decryptToken(pendingCookie));
  } catch {
    return NextResponse.redirect(new URL("/settings?x_error=expired", request.url));
  }

  // The token in the callback URL must match the one we issued — otherwise
  // this isn't the handshake we started.
  if (pending.oauth_token !== oauthToken) {
    return NextResponse.redirect(new URL("/settings?x_error=token_mismatch", request.url));
  }

  const appKey = process.env.X_API_KEY;
  const appSecret = process.env.X_API_SECRET;
  if (!appKey || !appSecret) {
    return NextResponse.redirect(new URL("/settings?x_error=not_configured", request.url));
  }

  try {
    const requestClient = new TwitterApi({
      appKey,
      appSecret,
      accessToken: pending.oauth_token,
      accessSecret: pending.oauth_token_secret,
    });
    const { client: loggedClient, accessToken, accessSecret } = await requestClient.login(oauthVerifier);
    const me = await loggedClient.v2.me();

    await prisma.accountSocialToken.upsert({
      where: { accountId_platform: { accountId: pending.accountId, platform: "X" } },
      update: {
        accessToken: encryptToken(accessToken),
        accessTokenSecret: encryptToken(accessSecret),
        externalUserId: me.data.id,
        externalUsername: me.data.username,
      },
      create: {
        accountId: pending.accountId,
        platform: "X",
        accessToken: encryptToken(accessToken),
        accessTokenSecret: encryptToken(accessSecret),
        externalUserId: me.data.id,
        externalUsername: me.data.username,
      },
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
