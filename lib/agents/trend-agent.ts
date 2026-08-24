import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { callStructuredClaude, buildSystemPrompt } from "@/lib/agents/claude-client";
import { runKeywordPreFilter } from "@/lib/agents/risk-tiers";

const summarySchema = z.object({
  summary: z.string(),
});

const inputSchema = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "A 1-2 sentence summary of why this trend matters for this business's audience",
    },
  },
  required: ["summary"],
};

export interface TrendAgentItemResult {
  trendId: string;
  ok: boolean;
  error?: string;
}

/**
 * AUTO-tier: summarizing a trend never needs approval. But a risky trending
 * topic must not silently flow into the Content Agent's prompt input, so the
 * same keyword pre-filter used for conversations gates what gets summarized.
 */
export async function runTrendAgentOnInput(accountId: string, trendId: string): Promise<TrendAgentItemResult> {
  const trend = await prisma.trendInput.findUnique({ where: { id: trendId } });
  if (!trend) return { trendId, ok: false, error: "Trend input not found" };
  if (trend.processedAt) return { trendId, ok: true };

  const { flagged, matchedKeywords } = runKeywordPreFilter(`${trend.topic} ${trend.rawSignal}`);

  if (flagged) {
    await prisma.trendInput.update({
      where: { id: trend.id },
      data: {
        riskTier: "NEVER",
        matchedKeywords: matchedKeywords.join(", "),
        summary: null,
        processedAt: new Date(),
      },
    });
    return { trendId, ok: true };
  }

  try {
    const system = await buildSystemPrompt(accountId);
    const result = await callStructuredClaude({
      toolName: "record_trend_summary",
      toolDescription: "Records a short summary of a trending topic for use in later post drafting.",
      inputSchema,
      zodSchema: summarySchema,
      system,
      userMessage: `Summarize this trend for this business's content planning.

Topic: ${trend.topic}
Signal: "${trend.rawSignal}"`,
    });

    await prisma.trendInput.update({
      where: { id: trend.id },
      data: {
        riskTier: "AUTO",
        matchedKeywords: null,
        summary: result.summary,
        processedAt: new Date(),
      },
    });
    return { trendId, ok: true };
  } catch (err) {
    return { trendId, ok: false, error: String(err) };
  }
}

export async function runTrendAgent(accountId: string): Promise<TrendAgentItemResult[]> {
  const unprocessed = await prisma.trendInput.findMany({
    where: { accountId, processedAt: null },
    select: { id: true },
  });

  const results: TrendAgentItemResult[] = [];
  for (const trend of unprocessed) {
    results.push(await runTrendAgentOnInput(accountId, trend.id));
  }
  return results;
}
