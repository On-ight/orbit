import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { callStructuredLLM } from "@/lib/agents/llm-client";

const draftSchema = z.object({
  content: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

const inputSchema = {
  type: "object",
  properties: {
    content: { type: "string", description: "The full text of the post, ready to publish" },
    confidence: { type: "number", description: "0 to 1 confidence this post is on-brand and worth publishing" },
    reasoning: { type: "string", description: "Why this angle, in one or two sentences" },
  },
  required: ["content", "confidence", "reasoning"],
};

export interface ContentAgentItemResult {
  trendId: string;
  ok: boolean;
  error?: string;
}

/**
 * Drafts a post from a trend the Trend Agent already summarized and cleared
 * (riskTier AUTO). Content generation itself is AUTO-tier, but publishing is
 * always APPROVAL-tier per the action policy, so every draft lands in the
 * approval queue rather than going out directly.
 */
export async function runContentAgentOnTrend(trendId: string): Promise<ContentAgentItemResult> {
  const trend = await prisma.trendInput.findUnique({
    where: { id: trendId },
    include: { posts: { select: { id: true } } },
  });
  if (!trend) return { trendId, ok: false, error: "Trend input not found" };
  if (trend.riskTier !== "AUTO" || !trend.summary) return { trendId, ok: true };
  if (trend.posts.length > 0) return { trendId, ok: true };

  try {
    const draft = await callStructuredLLM({
      toolName: "record_post_draft",
      toolDescription: "Records a drafted social post reacting to a trend.",
      inputSchema,
      zodSchema: draftSchema,
      userMessage: `Draft a short X post reacting to this trend for OnSight.

Topic: ${trend.topic}
Trend summary: ${trend.summary}

Keep it to 1-3 sentences, on-brand, no hashtag spam.`,
    });

    const post = await prisma.post.create({
      data: {
        content: draft.content,
        platform: "X",
        status: "DRAFT",
        sourceTrendId: trend.id,
      },
    });

    await prisma.approval.create({
      data: {
        type: "POST",
        platform: "X",
        content: draft.content,
        aiReasoning: draft.reasoning,
        confidence: draft.confidence,
        riskTier: "APPROVAL",
        postId: post.id,
      },
    });

    return { trendId, ok: true };
  } catch (err) {
    return { trendId, ok: false, error: String(err) };
  }
}

export async function runContentAgent(): Promise<ContentAgentItemResult[]> {
  const readyTrends = await prisma.trendInput.findMany({
    where: { riskTier: "AUTO", summary: { not: null } },
    select: { id: true },
  });

  const results: ContentAgentItemResult[] = [];
  for (const trend of readyTrends) {
    results.push(await runContentAgentOnTrend(trend.id));
  }
  return results;
}
