import { ApiResponseError, TwitterApi } from "twitter-api-v2";

export function isXConfigured(): boolean {
  return Boolean(
    process.env.X_API_KEY &&
      process.env.X_API_SECRET &&
      process.env.X_ACCESS_TOKEN &&
      process.env.X_ACCESS_SECRET,
  );
}

let client: TwitterApi | null = null;

function getClient(): TwitterApi {
  if (!client) {
    const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;
    if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
      throw new Error("X API credentials are not fully configured");
    }
    // OAuth 1.0a user-context auth — a permanent token generated once in the
    // X Developer Portal, no refresh flow needed for a single-user app.
    client = new TwitterApi({
      appKey: X_API_KEY,
      appSecret: X_API_SECRET,
      accessToken: X_ACCESS_TOKEN,
      accessSecret: X_ACCESS_SECRET,
    });
  }
  return client;
}

export interface PublishedXPost {
  platformPostId: string;
  url: string;
}

/**
 * Publishes a post to X for real. Throws on failure (invalid credentials,
 * rate limit, network error) — callers must NOT mark anything as published
 * unless this resolves successfully.
 */
export async function publishPostToX(content: string): Promise<PublishedXPost> {
  try {
    const result = await getClient().readWrite.v2.tweet(content);
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
