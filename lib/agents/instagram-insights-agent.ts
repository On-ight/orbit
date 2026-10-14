import { prisma } from "@/lib/db/prisma";
import { isInstagramConnected, getInstagramAuth, getMediaInsights } from "@/lib/publishing/instagram-client";

// Re-polling posts from months ago is wasted API calls — engagement on an
// old post barely moves, so only the last LOOKBACK_DAYS get refreshed each
// cycle. A post older than this just keeps whatever InstagramInsight row it
// already has (or none, if it was never in this window).
const LOOKBACK_DAYS = 30;

// Below this many measured posts, a "your best performer" claim would be
// drawn from too small a sample to be useful guidance — skip writing/
// updating the summary entirely rather than inject a shaky conclusion.
const MIN_POSTS_FOR_SUMMARY = 3;

// Stable key so each cycle replaces the previous summary instead of
// accumulating duplicates — the first (and still only) app-written
// KnowledgeBaseEntry; every other entry today is user-authored freeform
// content, not targeted by key at all.
const PERFORMANCE_KB_KEY = "INSTAGRAM_PERFORMANCE";

export interface InstagramInsightsResult {
  ok: boolean;
  fetched: number;
  failed: number;
}

export interface TopPost {
  title: string;
  mediaType: string;
  likes: number;
  comments: number;
  engagement: number;
}

export interface PerformanceSummary {
  topPosts: TopPost[];
  reelsAvgEngagement: number | null;
  carouselsAvgEngagement: number | null;
}

type InsightWithApproval = {
  mediaType: string;
  likes: number | null;
  comments: number | null;
  totalInteractions: number | null;
  approval: { content: string };
};

function engagementOf(i: { likes: number | null; comments: number | null; totalInteractions: number | null }): number {
  return i.totalInteractions ?? (i.likes ?? 0) + (i.comments ?? 0);
}

/**
 * Shared by the fetch job below and app/(dashboard)/marketing-tips/page.tsx
 * — one computation, read by both, instead of duplicating the "top posts +
 * format comparison" logic in two places. Returns null below
 * MIN_POSTS_FOR_SUMMARY, same threshold the KB-entry writer uses.
 */
export async function computePerformanceSummary(accountId: string): Promise<PerformanceSummary | null> {
  const insights: InsightWithApproval[] = await prisma.instagramInsight.findMany({
    where: { accountId },
    select: {
      mediaType: true,
      likes: true,
      comments: true,
      totalInteractions: true,
      approval: { select: { content: true } },
    },
  });

  if (insights.length < MIN_POSTS_FOR_SUMMARY) return null;

  const topPosts: TopPost[] = [...insights]
    .sort((a, b) => engagementOf(b) - engagementOf(a))
    .slice(0, 3)
    .map((i) => ({
      title: i.approval.content.length > 80 ? `${i.approval.content.slice(0, 80)}…` : i.approval.content,
      mediaType: i.mediaType,
      likes: i.likes ?? 0,
      comments: i.comments ?? 0,
      engagement: engagementOf(i),
    }));

  const avg = (list: InsightWithApproval[]): number | null =>
    list.length === 0 ? null : list.reduce((sum, i) => sum + engagementOf(i), 0) / list.length;

  return {
    topPosts,
    reelsAvgEngagement: avg(insights.filter((i) => i.mediaType === "REELS")),
    carouselsAvgEngagement: avg(insights.filter((i) => i.mediaType === "CAROUSEL_ALBUM")),
  };
}

function buildPerformanceSummaryText(summary: PerformanceSummary): string {
  const lines: string[] = [];
  const top = summary.topPosts[0];
  if (top) {
    const kind = top.mediaType === "REELS" ? "Reel" : "Carousel";
    lines.push(
      `Your best-performing recent Instagram post was a ${kind} ("${top.title}") with ${top.likes} likes and ${top.comments} comments.`,
    );
  }

  const { reelsAvgEngagement: r, carouselsAvgEngagement: c } = summary;
  if (r !== null && c !== null && r !== c) {
    const [leader, laggard, leaderAvg, laggardAvg] = r > c ? ["Reels", "Carousels", r, c] : ["Carousels", "Reels", c, r];
    const ratio = (leaderAvg / Math.max(laggardAvg, 1)).toFixed(1);
    lines.push(`${leader} are outperforming ${laggard} by about ${ratio}x on average recently — lean toward ${leader} when the format choice is open.`);
  }

  return lines.join(" ");
}

/**
 * Keeps the account's "INSTAGRAM_PERFORMANCE" KnowledgeBaseEntry current —
 * buildSystemPrompt() (lib/agents/llm-client.ts) already folds every KB
 * entry into every content/reel/carousel generation call, so this is the
 * entire mechanism for "optimize future content based on what performed
 * well." No changes needed to any generation agent itself.
 */
async function updatePerformanceSummary(accountId: string): Promise<void> {
  const summary = await computePerformanceSummary(accountId);
  const existing = await prisma.knowledgeBaseEntry.findFirst({ where: { accountId, key: PERFORMANCE_KB_KEY } });

  if (!summary) {
    // Not enough data yet (or no longer) — remove any stale summary rather
    // than leave an outdated claim sitting in every future prompt.
    if (existing) await prisma.knowledgeBaseEntry.delete({ where: { id: existing.id } });
    return;
  }

  const content = buildPerformanceSummaryText(summary);
  if (!content) return;

  if (existing) {
    await prisma.knowledgeBaseEntry.update({ where: { id: existing.id }, data: { content } });
  } else {
    await prisma.knowledgeBaseEntry.create({
      data: { accountId, key: PERFORMANCE_KB_KEY, title: "Instagram performance (auto-updated)", content },
    });
  }
}

/**
 * Refreshes InstagramInsight rows for this account's recently-published
 * Reels/Carousels, then regenerates the performance summary KB entry.
 * No-op (not an error) if Instagram isn't connected — same convention as
 * every other optional-integration agent in this codebase.
 */
export async function fetchInstagramInsights(accountId: string): Promise<InstagramInsightsResult> {
  if (!(await isInstagramConnected(accountId))) return { ok: true, fetched: 0, failed: 0 };

  const auth = await getInstagramAuth(accountId);
  if (!auth) return { ok: true, fetched: 0, failed: 0 };

  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const approvals = await prisma.approval.findMany({
    where: {
      accountId,
      publishedVia: "INSTAGRAM",
      platformPostId: { not: null },
      resolvedAt: { gte: since },
    },
    select: { id: true, platformPostId: true, type: true },
  });

  let fetched = 0;
  let failed = 0;
  for (const approval of approvals) {
    try {
      const insights = await getMediaInsights(auth, approval.platformPostId!);
      const mediaType = approval.type === "REEL" ? "REELS" : "CAROUSEL_ALBUM";
      await prisma.instagramInsight.upsert({
        where: { approvalId: approval.id },
        update: { mediaType, ...insights },
        create: { accountId, approvalId: approval.id, mediaType, ...insights },
      });
      fetched++;
    } catch (err) {
      failed++;
      console.error(`Failed to fetch Instagram insights for approval ${approval.id}:`, err);
    }
  }

  await updatePerformanceSummary(accountId);

  return { ok: true, fetched, failed };
}
