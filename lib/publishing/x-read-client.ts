import { TwitterApi } from "twitter-api-v2";
import { prisma } from "@/lib/db/prisma";
import { encryptToken, decryptToken } from "@/lib/security/token-crypto";

// Refresh early, not right at expiry — a cycle mid-refresh shouldn't lose a
// race against the token actually expiring partway through a run.
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

/**
 * Returns a ready-to-use read client for this account's connected X token,
 * refreshing it first if it's expired or close to it. Returns null if the
 * account has no X connection — callers should treat that as "nothing to
 * discover from", not an error.
 */
export async function getXReadClient(accountId: string): Promise<TwitterApi | null> {
  const token = await prisma.accountSocialToken.findUnique({
    where: { accountId_platform: { accountId, platform: "X" } },
  });
  if (!token) return null;

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const needsRefresh = token.tokenExpiresAt.getTime() - REFRESH_MARGIN_MS < Date.now();
  if (!needsRefresh) {
    return new TwitterApi(decryptToken(token.accessToken));
  }

  const refreshClient = new TwitterApi({ clientId, clientSecret });
  const {
    client: refreshedClient,
    accessToken,
    refreshToken,
    expiresIn,
  } = await refreshClient.refreshOAuth2Token(decryptToken(token.refreshToken));

  await prisma.accountSocialToken.update({
    where: { accountId_platform: { accountId, platform: "X" } },
    data: {
      accessToken: encryptToken(accessToken),
      // X may or may not rotate the refresh token on use — keep the old one
      // encrypted-stored if a new one wasn't issued, rather than losing it.
      refreshToken: encryptToken(refreshToken ?? decryptToken(token.refreshToken)),
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
    },
  });

  return refreshedClient;
}

/** The account's own X user id, for calls scoped to "me" (e.g. mentions). */
export async function getXExternalUserId(accountId: string): Promise<string | null> {
  const token = await prisma.accountSocialToken.findUnique({
    where: { accountId_platform: { accountId, platform: "X" } },
    select: { externalUserId: true },
  });
  return token?.externalUserId ?? null;
}
