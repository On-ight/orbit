import { z } from "zod";
import pLimit from "p-limit";
import { prisma } from "@/lib/db/prisma";
import { callStructuredCompletion, buildSystemPrompt } from "@/lib/agents/llm-client";
import { activeBufferPlatforms, isBufferConfigured, BufferPlatform } from "@/lib/publishing/buffer-client";
import { PLATFORM_CHAR_LIMITS as PLATFORM_LIMITS } from "@/lib/types";
import { limitsForTier } from "@/lib/billing/plan-limits";
import { countAiGenerationsThisMonth } from "@/lib/billing/usage";

// Bounds concurrent LLM calls against the single shared Groq key per account
// cycle — batches here are already small, this just cuts wall-clock time per
// cycle rather than raising per-account QPS a lot.
const limit = pLimit(3);

const variantSchema = z.object({
  content: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});
type Variant = z.infer<typeof variantSchema>;

export interface ContentAgentItemResult {
  trendId: string;
  ok: boolean;
  error?: string;
}

function platformKey(p: BufferPlatform): string {
  return p.toLowerCase();
}

/**
 * Drafts one adapted variant per requested platform in a single call, then
 * validates each platform's sub-object independently (safeParse, not the
 * atomic parse-or-throw callStructuredCompletion normally does) — so one bad
 * platform (e.g. a LinkedIn draft that ran long) doesn't discard drafts for
 * the other platforms that were actually fine. This mirrors a real lesson
 * from discover-trends.ts: tool-call outputs with more structure than a flat
 * object are worth validating defensively rather than trusting blindly.
 */
async function draftVariantsForTrend(
  accountId: string,
  trend: { topic: string; summary: string },
  platforms: BufferPlatform[],
): Promise<{ results: { platform: BufferPlatform; draft: Variant }[]; errors: string[] }> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const p of platforms) {
    const limit = PLATFORM_LIMITS[p];
    properties[platformKey(p)] = {
      type: "object",
      description: `Draft adapted for ${p}`,
      properties: {
        content: {
          type: "string",
          description: `The full text of the ${p} post, ready to publish. Must be ${limit} characters or fewer — ${p}'s hard limit.`,
        },
        confidence: {
          type: "number",
          description: "0 to 1 confidence this post is on-brand and worth publishing",
        },
        reasoning: { type: "string", description: "Why this angle, in one or two sentences" },
      },
      required: ["content", "confidence", "reasoning"],
    };
    required.push(platformKey(p));
  }

  const platformNotes = platforms
    .map((p) => `- ${p}: ${PLATFORM_LIMITS[p]} character hard limit — aim for well under this, not right up to it`)
    .join("\n");

  const system = await buildSystemPrompt(accountId);

  // Loose passthrough schema here on purpose — each platform's sub-object is
  // validated independently below instead of atomically via callStructuredCompletion.
  const raw = await callStructuredCompletion({
    toolName: "record_platform_drafts",
    toolDescription: "Records one drafted social post variant per requested platform, adapted to each platform's length and tone.",
    inputSchema: { type: "object", properties, required },
    zodSchema: z.record(z.string(), z.unknown()),
    system,
    userMessage: `Draft a post reacting to this trend, adapted for each platform below. The core
idea should be the same across platforms, but fit each one's length and register — X and Threads
are short and punchy, LinkedIn can be a bit more developed (though still on-brand, not corporate)
and should front-load the hook since only the first ~140-200 characters show before "see more."

Topic: ${trend.topic}
Trend summary: ${trend.summary}

Platforms to draft for:
${platformNotes}

No hashtag spam on any platform. Before finishing, count the characters in each platform's
"content" string individually against its limit above — a platform with a higher limit (like
Threads or LinkedIn) is not an invitation to write longer by default, and going over means that
platform's draft gets rejected outright and doesn't get published at all.`,
  });

  const results: { platform: BufferPlatform; draft: Variant }[] = [];
  const errors: string[] = [];

  for (const p of platforms) {
    const limit = PLATFORM_LIMITS[p];
    // A per-platform object field sometimes comes back JSON-stringified
    // instead of as a native object — same looseness seen in discover-trends.ts.
    const perPlatformSchema = z.preprocess(
      (val) => {
        if (typeof val === "string") {
          try {
            return JSON.parse(val);
          } catch {
            return val;
          }
        }
        return val;
      },
      z.object({
        content: z.string().max(limit, `${p} posts cannot exceed ${limit} characters`),
        confidence: z.number().min(0).max(1),
        reasoning: z.string(),
      }),
    );
    const parsed = perPlatformSchema.safeParse(raw[platformKey(p)]);
    if (parsed.success) {
      results.push({ platform: p, draft: parsed.data });
    } else {
      errors.push(`${p}: ${parsed.error.issues.map((i) => i.message).join(", ")}`);
    }
  }

  return { results, errors };
}

/**
 * Drafts a post from a trend the Trend Agent already summarized and cleared
 * (riskTier AUTO). Content generation itself is AUTO-tier, but publishing is
 * always APPROVAL-tier per the action policy, so every draft lands in the
 * approval queue rather than going out directly.
 *
 * One trend -> one Post + one Approval per connected platform (not one shared
 * row) — Post.sourceTrendId is already one-to-many and platform already
 * exists on both models, so this needed no relation changes. If Buffer isn't
 * configured for any platform, this falls back to exactly the original
 * behavior: X-only, via the direct X posting path in the approvals route.
 */
export async function runContentAgentOnTrend(accountId: string, trendId: string): Promise<ContentAgentItemResult> {
  const trend = await prisma.trendInput.findUnique({
    where: { id: trendId },
    include: { posts: { select: { platform: true } } },
  });
  if (!trend) return { trendId, ok: false, error: "Trend input not found" };
  if (trend.riskTier !== "AUTO" || !trend.summary) return { trendId, ok: true };

  const existingPlatforms = new Set(trend.posts.map((p) => p.platform));

  const bufferConfigured = await isBufferConfigured(accountId);
  const targetPlatforms: BufferPlatform[] = bufferConfigured
    ? (await activeBufferPlatforms(accountId)).filter((p) => !existingPlatforms.has(p))
    : existingPlatforms.has("X")
      ? []
      : ["X"];

  if (targetPlatforms.length === 0) return { trendId, ok: true };

  try {
    const { results, errors } = await draftVariantsForTrend(
      accountId,
      { topic: trend.topic, summary: trend.summary },
      targetPlatforms,
    );

    for (const { platform, draft } of results) {
      const post = await prisma.post.create({
        data: {
          accountId,
          content: draft.content,
          platform,
          status: "DRAFT",
          sourceTrendId: trend.id,
        },
      });

      await prisma.approval.create({
        data: {
          accountId,
          type: "POST",
          platform,
          content: draft.content,
          aiReasoning: draft.reasoning,
          confidence: draft.confidence,
          riskTier: "APPROVAL",
          postId: post.id,
        },
      });
    }

    if (results.length === 0) {
      return { trendId, ok: false, error: errors.join("; ") };
    }
    return { trendId, ok: true, error: errors.length > 0 ? errors.join("; ") : undefined };
  } catch (err) {
    return { trendId, ok: false, error: String(err) };
  }
}

export async function runContentAgent(accountId: string): Promise<ContentAgentItemResult[]> {
  const account = await prisma.account.findUnique({ where: { id: accountId }, select: { planTier: true } });
  const limits = limitsForTier(account?.planTier ?? null);

  if (limits.aiGenerationsPerMonth !== null) {
    const used = await countAiGenerationsThisMonth(accountId);
    if (used >= limits.aiGenerationsPerMonth) return [];
  }

  const readyTrends = await prisma.trendInput.findMany({
    where: { accountId, riskTier: "AUTO", summary: { not: null } },
    select: { id: true },
  });

  return Promise.all(readyTrends.map((trend) => limit(() => runContentAgentOnTrend(accountId, trend.id))));
}
