import { prisma } from "@/lib/db/prisma";
import { getXReadClient, getXExternalUserId } from "@/lib/publishing/x-read-client";

// X's pay-per-use pricing bills roughly $0.005 per post read — these caps
// bound real cost per cycle per account rather than pulling as much as the
// API allows. 10 is also the minimum max_results search/recent accepts.
const MAX_MENTIONS = 10;
const MAX_KEYWORDS = 3;
const MAX_RESULTS_PER_KEYWORD = 10;

interface MinimalTweet {
  id: string;
  text: string;
  created_at?: string;
  public_metrics?: { like_count?: number; reply_count?: number };
}
interface MinimalAuthor {
  username?: string;
  name?: string;
}

export interface DiscoverMentionsResult {
  ok: boolean;
  created: number;
  error?: string;
}

/**
 * Finds real posts worth replying to — the account's own X mentions, plus
 * keyword search if the account has configured any — and stores them as
 * Mention rows for the Community Agent to classify and draft against.
 * Returns { ok: true, created: 0 } rather than an error when the account
 * has no X connection: nothing to discover from isn't a failure.
 */
export async function discoverMentions(accountId: string): Promise<DiscoverMentionsResult> {
  const client = await getXReadClient(accountId);
  if (!client) {
    return { ok: true, created: 0 };
  }

  let created = 0;

  try {
    const userId = await getXExternalUserId(accountId);
    if (userId) {
      const timeline = await client.v2.userMentionTimeline(userId, {
        max_results: MAX_MENTIONS,
        expansions: ["author_id"],
        "tweet.fields": ["created_at", "public_metrics"],
        "user.fields": ["username", "name"],
      });
      for (const tweet of timeline.tweets) {
        const author = timeline.includes.author(tweet);
        if (await upsertMention(accountId, tweet, author, "MENTION", null)) created++;
      }
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { discoveryKeywords: true },
    });
    const keywords = (account?.discoveryKeywords ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, MAX_KEYWORDS);

    for (const keyword of keywords) {
      // -is:retweet: a repost of someone else's words isn't a conversation
      // to reply into.
      const results = await client.v2.search(`${keyword} -is:retweet`, {
        max_results: MAX_RESULTS_PER_KEYWORD,
        expansions: ["author_id"],
        "tweet.fields": ["created_at", "public_metrics"],
        "user.fields": ["username", "name"],
      });
      for (const tweet of results.tweets) {
        const author = results.includes.author(tweet);
        if (await upsertMention(accountId, tweet, author, "KEYWORD_SEARCH", keyword)) created++;
      }
    }

    return { ok: true, created };
  } catch (err) {
    return { ok: false, created, error: String(err) };
  }
}

async function upsertMention(
  accountId: string,
  tweet: MinimalTweet,
  author: MinimalAuthor | undefined,
  sourceType: "MENTION" | "KEYWORD_SEARCH",
  matchedKeyword: string | null,
): Promise<boolean> {
  const existing = await prisma.mention.findUnique({
    where: { accountId_platformPostId: { accountId, platformPostId: tweet.id } },
  });
  if (existing) return false;

  await prisma.mention.create({
    data: {
      accountId,
      platform: "X",
      platformPostId: tweet.id,
      sourceType,
      matchedKeyword,
      authorHandle: author?.username ?? "unknown",
      authorName: author?.name ?? "Unknown",
      text: tweet.text,
      likes: tweet.public_metrics?.like_count ?? 0,
      replyCount: tweet.public_metrics?.reply_count ?? 0,
      postedAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
    },
  });
  return true;
}
