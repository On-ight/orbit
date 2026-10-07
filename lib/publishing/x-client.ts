import { ApiResponseError, TwitterApi } from "twitter-api-v2";
import { prisma } from "@/lib/db/prisma";
import { encryptToken, decryptToken } from "@/lib/security/token-crypto";

// Refresh early, not right at expiry — a cycle mid-refresh shouldn't lose a
// race against the token actually expiring partway through a run.
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export async function isXConnected(accountId: string): Promise<boolean> {
  const token = await prisma.accountSocialToken.findUnique({
    where: { accountId_platform: { accountId, platform: "X" } },
  });
  return Boolean(token);
}

/**
 * Returns a ready-to-use client for this account's connected X token,
 * refreshing it first if it's expired or close to it. Returns null if the
 * account has no X connection — callers should treat that as "nothing to
 * do", not an error. One client, used for both reading (mentions discovery)
 * and writing (publishing) — the OAuth2 scope requested at connect time
 * (app/api/connections/x/start/route.ts) already includes tweet.write, so
 * there's no separate write-only credential or token needed; twitter-api-v2's
 * TwitterApi class exposes both read and write methods regardless of which
 * scopes the underlying token actually has — X's API itself is what enforces
 * the real permission check.
 */
export async function getXClient(accountId: string): Promise<TwitterApi | null> {
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

export interface PublishedXPost {
  platformPostId: string;
  url: string;
}

/**
 * Publishes a post to X for real, using this account's own connected
 * token — never a shared/global credential, so one tenant can never post
 * through another's connected account. Throws if the account isn't
 * connected, or on any API failure (invalid/expired token, rate limit,
 * network error) — callers must NOT mark anything as published unless this
 * resolves successfully.
 *
 * replyToTweetId, when given, posts this as a genuine in-thread reply
 * (X's reply.in_reply_to_tweet_id) instead of a standalone post — the data
 * needed for this (Mention.platformPostId, the real tweet being replied to)
 * already exists, it just wasn't wired through before.
 */
export async function publishPostToX(
  accountId: string,
  content: string,
  replyToTweetId?: string,
): Promise<PublishedXPost> {
  const client = await getXClient(accountId);
  if (!client) throw new Error(`Account ${accountId} has no X connection`);

  try {
    const result = await client.v2.tweet(
      content,
      replyToTweetId ? { reply: { in_reply_to_tweet_id: replyToTweetId } } : undefined,
    );
    const id = result.data.id;
    return {
      platformPostId: id,
      // Generic status URL — resolves correctly without needing the account's handle.
      url: `https://x.com/i/web/status/${id}`,
    };
  } catch (err) {
    if (err instanceof ApiResponseError) {
      const detail = JSON.stringify(err.data);
      throw new Error(`X API error ${err.code}: ${detail}`);
    }
    throw err;
  }
}
