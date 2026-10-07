import { prisma } from "@/lib/db/prisma";
import { encryptToken, decryptToken } from "@/lib/security/token-crypto";

const GRAPH_BASE = "https://graph.instagram.com";
// Long-lived tokens last 60 days — refreshing 5 days out leaves plenty of
// margin since this only ever runs from a background job, never a live
// user-facing request racing the deadline.
const REFRESH_MARGIN_MS = 5 * 24 * 60 * 60 * 1000;

// Instagram's algorithm as of 2026 only counts the first ~5 hashtags toward
// reach (the technical cap is still 30, but more than 5 is just wasted, not
// rejected) — the generation prompt already asks for at most 5, this is the
// hard backstop. There's no separate "first comment" field in this API, so
// hashtags get appended straight into the caption.
const MAX_HASHTAGS = 5;

export function buildInstagramCaption(content: string, hashtags: string | null): string {
  if (!hashtags) return content;
  const formatted = hashtags
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean)
    .slice(0, MAX_HASHTAGS)
    .map((h) => `#${h}`)
    .join(" ");
  return formatted ? `${content}\n\n${formatted}` : content;
}

export async function isInstagramConnected(accountId: string): Promise<boolean> {
  const token = await prisma.accountSocialToken.findUnique({
    where: { accountId_platform: { accountId, platform: "INSTAGRAM" } },
  });
  return Boolean(token);
}

export interface InstagramAuth {
  accessToken: string;
  igUserId: string;
}

/**
 * Returns a usable access token, refreshing first if it's within the
 * margin of its 60-day expiry. Instagram's long-lived token has no separate
 * refresh token (unlike X's OAuth2 flow) — the access token itself is what
 * gets exchanged for a fresh one via /refresh_access_token. Returns null if
 * the account never connected Instagram — callers should treat that as
 * "nothing to publish to," not an error.
 */
export async function getInstagramAuth(accountId: string): Promise<InstagramAuth | null> {
  const token = await prisma.accountSocialToken.findUnique({
    where: { accountId_platform: { accountId, platform: "INSTAGRAM" } },
  });
  if (!token) return null;

  const needsRefresh = token.tokenExpiresAt.getTime() - REFRESH_MARGIN_MS < Date.now();
  if (!needsRefresh) {
    return { accessToken: decryptToken(token.accessToken), igUserId: token.externalUserId };
  }

  const refreshUrl = new URL(`${GRAPH_BASE}/refresh_access_token`);
  refreshUrl.searchParams.set("grant_type", "ig_refresh_token");
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
      where: { accountId_platform: { accountId, platform: "INSTAGRAM" } },
      data: { accessToken: encrypted, refreshToken: encrypted, tokenExpiresAt: new Date(Date.now() + expiresIn * 1000) },
    });
    return { accessToken: newToken, igUserId: token.externalUserId };
  } catch (err) {
    // Refresh failing doesn't mean the current token is already dead — it
    // may still have days left. Let the actual publish call surface its own
    // clear error if the token has truly expired, rather than blocking here.
    console.error("Instagram token refresh failed, using existing token:", err);
    return { accessToken: decryptToken(token.accessToken), igUserId: token.externalUserId };
  }
}

async function postForm(url: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Instagram API error: ${JSON.stringify(body)}`);
  return body ?? {};
}

/** A single image, for one carousel slide (is_carousel_item) or a standalone post. */
export async function createImageContainer(
  auth: InstagramAuth,
  imageUrl: string,
  options: { isCarouselItem?: boolean; caption?: string } = {},
): Promise<string> {
  const body = await postForm(`${GRAPH_BASE}/${auth.igUserId}/media`, {
    image_url: imageUrl,
    access_token: auth.accessToken,
    ...(options.isCarouselItem ? { is_carousel_item: "true" } : {}),
    ...(options.caption ? { caption: options.caption } : {}),
  });
  if (typeof body.id !== "string") throw new Error(`Instagram image container missing id: ${JSON.stringify(body)}`);
  return body.id;
}

/** The parent container tying together up to 10 already-created child image containers. */
export async function createCarouselContainer(
  auth: InstagramAuth,
  childContainerIds: string[],
  caption: string,
): Promise<string> {
  const body = await postForm(`${GRAPH_BASE}/${auth.igUserId}/media`, {
    media_type: "CAROUSEL",
    children: childContainerIds.join(","),
    caption,
    access_token: auth.accessToken,
  });
  if (typeof body.id !== "string") throw new Error(`Instagram carousel container missing id: ${JSON.stringify(body)}`);
  return body.id;
}

/** A Reel — single video container, no carousel wrapping needed. */
export async function createReelContainer(auth: InstagramAuth, videoUrl: string, caption: string): Promise<string> {
  const body = await postForm(`${GRAPH_BASE}/${auth.igUserId}/media`, {
    media_type: "REELS",
    video_url: videoUrl,
    caption,
    access_token: auth.accessToken,
  });
  if (typeof body.id !== "string") throw new Error(`Instagram Reel container missing id: ${JSON.stringify(body)}`);
  return body.id;
}

export type ContainerStatus = "IN_PROGRESS" | "FINISHED" | "ERROR" | "EXPIRED" | "PUBLISHED" | "UNKNOWN";

/**
 * One status check — callers (the Inngest function) own the actual polling
 * loop via step.sleep, since a real sleep/retry loop has to be a durable
 * Inngest primitive, not something buried inside a plain async function.
 */
export async function getContainerStatus(auth: InstagramAuth, containerId: string): Promise<ContainerStatus> {
  const url = new URL(`${GRAPH_BASE}/${containerId}`);
  url.searchParams.set("fields", "status_code");
  url.searchParams.set("access_token", auth.accessToken);
  const res = await fetch(url.toString());
  const body = await res.json().catch(() => null);
  const status = body?.status_code;
  const known: ContainerStatus[] = ["IN_PROGRESS", "FINISHED", "ERROR", "EXPIRED", "PUBLISHED"];
  return known.includes(status) ? status : "UNKNOWN";
}

export async function publishContainer(auth: InstagramAuth, containerId: string): Promise<string> {
  const body = await postForm(`${GRAPH_BASE}/${auth.igUserId}/media_publish`, {
    creation_id: containerId,
    access_token: auth.accessToken,
  });
  if (typeof body.id !== "string") throw new Error(`Instagram media_publish missing id: ${JSON.stringify(body)}`);
  return body.id;
}

/** Best-effort — a missing permalink shouldn't fail an otherwise-successful publish. */
export async function getMediaPermalink(auth: InstagramAuth, mediaId: string): Promise<string | null> {
  try {
    const url = new URL(`${GRAPH_BASE}/${mediaId}`);
    url.searchParams.set("fields", "permalink");
    url.searchParams.set("access_token", auth.accessToken);
    const res = await fetch(url.toString());
    const body = await res.json().catch(() => null);
    return typeof body?.permalink === "string" ? body.permalink : null;
  } catch {
    return null;
  }
}
