import { createHash } from "crypto";
import { redis } from "@/lib/redis/client";

// Separate from React's cache() in current-user.ts, which only dedupes calls
// within a single request. This survives across separate navigations and
// serverless instances, trading up to 5 minutes of revocation lag (same
// order of magnitude as the X token refresh margin in x-read-client.ts) for
// skipping the live Firebase network round-trip on repeat navigations.
const TTL_SECONDS = 5 * 60;

function cacheKey(cookieValue: string): string {
  return `session-valid:${createHash("sha256").update(cookieValue).digest("hex")}`;
}

export async function getCachedSessionUid(cookieValue: string): Promise<string | null> {
  const cached = await redis.get<{ uid: string }>(cacheKey(cookieValue));
  return cached?.uid ?? null;
}

export async function cacheSessionUid(cookieValue: string, uid: string): Promise<void> {
  await redis.set(cacheKey(cookieValue), { uid }, { ex: TTL_SECONDS });
}
