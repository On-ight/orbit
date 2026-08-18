import { Platform } from "@/lib/types";

const BUFFER_API_URL = "https://api.buffer.com";

export type BufferPlatform = Platform;

const CHANNEL_ENV_VAR: Record<BufferPlatform, string> = {
  X: "BUFFER_X_CHANNEL_ID",
  THREADS: "BUFFER_THREADS_CHANNEL_ID",
  LINKEDIN: "BUFFER_LINKEDIN_CHANNEL_ID",
};

/** True if Buffer is usable at all — at least one platform channel configured. */
export function isBufferConfigured(): boolean {
  if (!process.env.BUFFER_API_KEY) return false;
  return (Object.keys(CHANNEL_ENV_VAR) as BufferPlatform[]).some((p) => isBufferConfiguredForPlatform(p));
}

export function isBufferConfiguredForPlatform(platform: BufferPlatform): boolean {
  return Boolean(process.env.BUFFER_API_KEY && process.env[CHANNEL_ENV_VAR[platform]]);
}

export function activeBufferPlatforms(): BufferPlatform[] {
  return (Object.keys(CHANNEL_ENV_VAR) as BufferPlatform[]).filter((p) => isBufferConfiguredForPlatform(p));
}

function getChannelId(platform: BufferPlatform): string {
  const channelId = process.env[CHANNEL_ENV_VAR[platform]];
  if (!channelId) throw new Error(`${CHANNEL_ENV_VAR[platform]} is not set`);
  return channelId;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

async function bufferGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const apiKey = process.env.BUFFER_API_KEY;
  if (!apiKey) throw new Error("BUFFER_API_KEY is not set");

  const res = await fetch(BUFFER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const body: GraphQLResponse<T> = await res.json();

  if (!res.ok || body.errors?.length) {
    const detail = body.errors?.map((e) => e.message).join("; ") ?? `HTTP ${res.status}`;
    throw new Error(`Buffer API error: ${detail}`);
  }
  if (!body.data) throw new Error("Buffer API returned no data");
  return body.data;
}

export interface BufferChannel {
  id: string;
  name: string;
  service: string;
}

/** Lists channels connected to the API key's organization — used once to find each platform's channel ID for .env.local. */
export async function listBufferChannels(): Promise<BufferChannel[]> {
  const orgData = await bufferGraphQL<{ account: { organizations: { id: string; name: string }[] } }>(
    `query { account { organizations { id name } } }`,
  );
  const org = orgData.account.organizations[0];
  if (!org) throw new Error("No Buffer organization found for this API key");

  const channelData = await bufferGraphQL<{ channels: BufferChannel[] }>(
    `query GetChannels($organizationId: OrganizationId!) {
      channels(input: { organizationId: $organizationId }) { id name service }
    }`,
    { organizationId: org.id },
  );
  return channelData.channels;
}

export interface ScheduledBufferPost {
  bufferPostId: string;
  status: "SCHEDULED" | "QUEUED";
}

/**
 * Schedules a post through Buffer on the given platform's connected channel.
 * If dueAt is provided, it's scheduled for that exact time (customScheduled);
 * otherwise it's added to Buffer's queue for the next available slot.
 * imageUrl (LinkedIn only in practice) must be a publicly reachable,
 * non-expiring URL — Buffer fetches it at actual publish time, which for a
 * scheduled post can be hours or days later, so a signed/expiring URL will
 * fail silently down the line. Throws on failure — callers must not mark
 * anything as published/scheduled unless this resolves successfully.
 */
export async function schedulePostToBuffer(
  content: string,
  platform: BufferPlatform,
  dueAt?: Date,
  imageUrl?: string,
): Promise<ScheduledBufferPost> {
  const channelId = getChannelId(platform);

  const input: Record<string, unknown> = {
    text: content,
    channelId,
    schedulingType: "automatic",
    mode: dueAt ? "customScheduled" : "addToQueue",
  };
  if (dueAt) input.dueAt = dueAt.toISOString();
  if (imageUrl) input.assets = [{ image: { url: imageUrl } }];

  const data = await bufferGraphQL<{
    createPost: { post?: { id: string }; message?: string };
  }>(
    `mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess { post { id } }
        ... on MutationError { message }
      }
    }`,
    { input },
  );

  if (!data.createPost.post) {
    throw new Error(`Buffer rejected the post: ${data.createPost.message ?? "unknown error"}`);
  }

  return {
    bufferPostId: data.createPost.post.id,
    status: dueAt ? "SCHEDULED" : "QUEUED",
  };
}
