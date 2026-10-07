import { prisma } from "@/lib/db/prisma";
import { encryptToken, decryptToken } from "@/lib/security/token-crypto";

// Meta's current official docs consistently use the .com domain for both
// OAuth and the Graph API itself (verified this session) — some older
// third-party posts still reference threads.net from before this, but .com
// is what Meta's own docs show today.
const GRAPH_BASE = "https://graph.threads.com";
// Long-lived tokens last 60 days — refreshing 5 days out leaves plenty of
// margin since this only ever runs from a background job.
const REFRESH_MARGIN_MS = 5 * 24 * 60 * 60 * 1000;

export async function isThreadsConnected(accountId: string): Promise<boolean> {
  const token = await prisma.accountSocialToken.findUnique({
    where: { accountId_platform: { accountId, platform: "THREADS" } },
  });
  return Boolean(token);
}

export interface ThreadsAuth {
  accessToken: string;
  threadsUserId: string;
}

/**
 * Returns a usable access token, refreshing first if within the margin of
 * its 60-day expiry — same shape as lib/publishing/instagram-client.ts's
 * getInstagramAuth, Threads has the identical long-lived-token-refreshes-
 * itself model (no separate refresh token). Returns null if the account
 * never connected Threads directly.
 */
export async function getThreadsAuth(accountId: string): Promise<ThreadsAuth | null> {
  const token = await prisma.accountSocialToken.findUnique({
    where: { accountId_platform: { accountId, platform: "THREADS" } },
  });
  if (!token) return null;

  const needsRefresh = token.tokenExpiresAt.getTime() - REFRESH_MARGIN_MS < Date.now();
  if (!needsRefresh) {
    return { accessToken: decryptToken(token.accessToken), threadsUserId: token.externalUserId };
  }

  const refreshUrl = new URL(`${GRAPH_BASE}/refresh_access_token`);
  refreshUrl.searchParams.set("grant_type", "th_refresh_token");
  refreshUrl.searchParams.set("access_token", decryptToken(token.accessToken));

  try {
    const res = await fetch(refreshUrl.toString());
    const body = await res.json().catch(() => null);
    const newToken = body?.access_token;
    const expiresIn = body?.expires_in;
    if (!res.ok || typeof newToken !== "string" || typeof expiresIn !== "number") {
      throw new Error(`Refresh failed: ${JSON.stringify(body)}`);
    }

    const encrypted = encryptToken(newToken);
    await prisma.accountSocialToken.update({
      where: { accountId_platform: { accountId, platform: "THREADS" } },
      data: { accessToken: encrypted, refreshToken: encrypted, tokenExpiresAt: new Date(Date.now() + expiresIn * 1000) },
    });
    return { accessToken: newToken, threadsUserId: token.externalUserId };
  } catch (err) {
    console.error("Threads token refresh failed, using existing token:", err);
    return { accessToken: decryptToken(token.accessToken), threadsUserId: token.externalUserId };
  }
}

async function postForm(url: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Threads API error: ${JSON.stringify(body)}`);
  return body ?? {};
}

export async function createTextContainer(auth: ThreadsAuth, text: string): Promise<string> {
  const body = await postForm(`${GRAPH_BASE}/v1.0/${auth.threadsUserId}/threads`, {
    media_type: "TEXT",
    text,
    access_token: auth.accessToken,
  });
  if (typeof body.id !== "string") throw new Error(`Threads container missing id: ${JSON.stringify(body)}`);
  return body.id;
}

export async function publishThreadsContainer(auth: ThreadsAuth, containerId: string): Promise<string> {
  const body = await postForm(`${GRAPH_BASE}/v1.0/${auth.threadsUserId}/threads_publish`, {
    creation_id: containerId,
    access_token: auth.accessToken,
  });
  if (typeof body.id !== "string") throw new Error(`Threads publish missing id: ${JSON.stringify(body)}`);
  return body.id;
}

/** Best-effort — a missing permalink shouldn't fail an otherwise-successful publish. */
export async function getThreadsPermalink(auth: ThreadsAuth, postId: string): Promise<string | null> {
  try {
    const url = new URL(`${GRAPH_BASE}/v1.0/${postId}`);
    url.searchParams.set("fields", "permalink");
    url.searchParams.set("access_token", auth.accessToken);
    const res = await fetch(url.toString());
    const body = await res.json().catch(() => null);
    return typeof body?.permalink === "string" ? body.permalink : null;
  } catch {
    return null;
  }
}
