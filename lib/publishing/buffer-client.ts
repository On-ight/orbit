import { Platform } from "@/lib/types";
import { prisma } from "@/lib/db/prisma";

const BUFFER_API_URL = "https://api.buffer.com";

export type BufferPlatform = Platform;

// One shared Orbit-owned Buffer account/API key serves every tenant — each
// customer's connected channel is manually added to it (see
// scripts/assign-buffer-channel.ts) and recorded per-account in
// AccountBufferChannel, since Buffer's own OAuth app registration for new
// developers is closed (no self-serve "connect your account" flow is
// possible directly against Buffer's API today).

/** True if Buffer is usable at all for this account — at least one platform channel assigned. */
export async function isBufferConfigured(accountId: string): Promise<boolean> {
  if (!process.env.BUFFER_API_KEY) return false;
  const count = await prisma.accountBufferChannel.count({ where: { accountId } });
  return count > 0;
}

export async function isBufferConfiguredForPlatform(
  accountId: string,
  platform: BufferPlatform,
): Promise<boolean> {
  if (!process.env.BUFFER_API_KEY) return false;
  const channel = await prisma.accountBufferChannel.findUnique({
    where: { accountId_platform: { accountId, platform } },
  });
  return Boolean(channel);
}

export async function activeBufferPlatforms(accountId: string): Promise<BufferPlatform[]> {
  if (!process.env.BUFFER_API_KEY) return [];
  const channels = await prisma.accountBufferChannel.findMany({ where: { accountId } });
  return channels.map((c) => c.platform as BufferPlatform);
}

async function getChannelId(accountId: string, platform: BufferPlatform): Promise<string> {
  const channel = await prisma.accountBufferChannel.findUnique({
    where: { accountId_platform: { accountId, platform } },
  });
  if (!channel) {
    throw new Error(`No Buffer channel configured for this account on ${platform}`);
  }
  return channel.bufferChannelId;
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

/**
 * Lists every channel connected to Orbit's one shared Buffer account —
 * used by the founder (via scripts/list-buffer-channels.ts) to find a newly
 * connected customer's channel id after manually adding it in Buffer's own
 * dashboard, then assigning it to that customer's account via
 * scripts/assign-buffer-channel.ts.
 */
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
 * Schedules a post through Buffer on this account's connected channel for
 * the given platform. If dueAt is provided, it's scheduled for that exact
 * time (customScheduled); otherwise it's added to Buffer's queue for the
 * next available slot. imageUrl (LinkedIn only in practice) must be a
 * publicly reachable, non-expiring URL — Buffer fetches it at actual publish
 * time, which for a scheduled post can be hours or days later, so a signed/
 * expiring URL will fail silently down the line. Throws on failure — callers
 * must not mark anything as published/scheduled unless this resolves
 * successfully.
 */
export async function schedulePostToBuffer(
  accountId: string,
  content: string,
  platform: BufferPlatform,
  dueAt?: Date,
  imageUrl?: string,
): Promise<ScheduledBufferPost> {
  const channelId = await getChannelId(accountId, platform);

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
