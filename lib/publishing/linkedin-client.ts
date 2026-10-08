import { prisma } from "@/lib/db/prisma";
import { decryptToken } from "@/lib/security/token-crypto";

const API_BASE = "https://api.linkedin.com";
// LinkedIn's REST APIs are versioned by calendar month, not a fixed number —
// pinned to one known-good month rather than computed at runtime, so a
// version bump on LinkedIn's end can't silently change behavior underneath
// this. Bump deliberately if a newer version is needed.
const LINKEDIN_VERSION = "202509";

export async function isLinkedInConnected(accountId: string): Promise<boolean> {
  const token = await prisma.accountSocialToken.findUnique({
    where: { accountId_platform: { accountId, platform: "LINKEDIN" } },
  });
  return Boolean(token);
}

export interface LinkedInAuth {
  accessToken: string;
  personUrn: string;
}

/**
 * Returns a usable auth context, or null if not connected OR the token has
 * expired. Deliberately no refresh attempt here — LinkedIn only issues a
 * programmatic refresh token to approved Marketing Developer Platform
 * partners, not available on this self-serve setup, so an expired token
 * genuinely cannot be refreshed. The member has to reconnect (click
 * "Connect LinkedIn" again) roughly every 60 days; null here just means
 * "treat as not connected," same UI state Settings already shows.
 */
export async function getLinkedInAuth(accountId: string): Promise<LinkedInAuth | null> {
  const token = await prisma.accountSocialToken.findUnique({
    where: { accountId_platform: { accountId, platform: "LINKEDIN" } },
  });
  if (!token || token.tokenExpiresAt.getTime() <= Date.now()) return null;
  return { accessToken: decryptToken(token.accessToken), personUrn: `urn:li:person:${token.externalUserId}` };
}

function authHeaders(accessToken: string, extra?: Record<string, string>): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Linkedin-Version": LINKEDIN_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
    ...extra,
  };
}

/**
 * Uploads an already-hosted image (a Vercel Blob URL from the existing
 * LinkedIn image-attachment feature) to LinkedIn's own asset storage —
 * LinkedIn's Posts API only accepts an image URN it owns, not an arbitrary
 * public URL like Buffer/Instagram/Threads do. Two steps: register the
 * upload to get a presigned uploadUrl + image URN, then PUT the actual
 * bytes to that URL.
 */
async function uploadImageToLinkedIn(auth: LinkedInAuth, imageUrl: string): Promise<string> {
  const initRes = await fetch(`${API_BASE}/rest/images?action=initializeUpload`, {
    method: "POST",
    headers: authHeaders(auth.accessToken, { "Content-Type": "application/json" }),
    body: JSON.stringify({ initializeUploadRequest: { owner: auth.personUrn } }),
  });
  const initBody = await initRes.json().catch(() => null);
  const uploadUrl = initBody?.value?.uploadUrl;
  const imageUrn = initBody?.value?.image;
  if (!initRes.ok || typeof uploadUrl !== "string" || typeof imageUrn !== "string") {
    throw new Error(`LinkedIn image upload init failed: ${JSON.stringify(initBody)}`);
  }

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error(`Failed to fetch source image ${imageUrl}`);
  const buffer = Buffer.from(await imageRes.arrayBuffer());

  const putRes = await fetch(uploadUrl, { method: "PUT", body: buffer });
  if (!putRes.ok) throw new Error(`LinkedIn image byte upload failed: HTTP ${putRes.status}`);

  return imageUrn;
}

export interface PublishedLinkedInPost {
  platformPostId: string;
  url: string;
}

/**
 * Publishes a post to LinkedIn for real, using this account's own connected
 * member token — never a shared/global credential. imageUrl (LinkedIn only,
 * user-attached) is optional and goes through the two-step Images API above
 * when given. Throws if the account isn't connected (or its token expired),
 * or on any API failure — callers must NOT mark anything as published
 * unless this resolves successfully.
 */
export async function publishPostToLinkedIn(
  accountId: string,
  content: string,
  imageUrl?: string,
): Promise<PublishedLinkedInPost> {
  const auth = await getLinkedInAuth(accountId);
  if (!auth) throw new Error(`Account ${accountId} has no active LinkedIn connection`);

  const imageUrn = imageUrl ? await uploadImageToLinkedIn(auth, imageUrl) : undefined;

  const res = await fetch(`${API_BASE}/rest/posts`, {
    method: "POST",
    headers: authHeaders(auth.accessToken, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      author: auth.personUrn,
      commentary: content,
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
      ...(imageUrn ? { content: { media: { id: imageUrn } } } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(`LinkedIn API error: ${JSON.stringify(body)}`);
  }

  // The created post's URN comes back in a response header, not the body.
  const postUrn = res.headers.get("x-restli-id");
  if (!postUrn) throw new Error("LinkedIn API returned no x-restli-id header");

  return {
    platformPostId: postUrn,
    url: `https://www.linkedin.com/feed/update/${postUrn}/`,
  };
}
