import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { callStructuredClaude, ClaudeRefusalError } from "@/lib/agents/claude-client";
import { resolveRiskTier } from "@/lib/agents/risk-tiers";
import { INTENT_LEVELS, RISK_TIERS } from "@/lib/types";

const analysisSchema = z.object({
  intent: z.enum(INTENT_LEVELS),
  topic: z.string(),
  potentialCustomer: z.boolean(),
  confidence: z.number().min(0).max(1),
  riskTier: z.enum(RISK_TIERS),
  riskReasoning: z.string(),
  recommendedAction: z.string(),
  draftReply: z.string().nullable(),
  reasoning: z.string(),
});

const inputSchema = {
  type: "object",
  properties: {
    intent: { type: "string", enum: INTENT_LEVELS },
    topic: { type: "string", description: "Short label for what this mention is about" },
    potentialCustomer: { type: "boolean" },
    confidence: { type: "number", description: "0 to 1 confidence in the draft reply" },
    riskTier: {
      type: "string",
      enum: RISK_TIERS,
      description:
        "Your own risk self-assessment. NEVER if this touches politics, complaints, accusations, brand reputation, or unverified safety claims.",
    },
    riskReasoning: { type: "string" },
    recommendedAction: {
      type: "string",
      description: "e.g. 'Reply', 'Ignore', or 'Flagged — do not auto-draft. Requires manual review.'",
    },
    draftReply: {
      type: ["string", "null"],
      description: "A ready-to-send reply. Must be null if riskTier is NEVER.",
    },
    reasoning: { type: "string", description: "Why you scored intent/drafted this way" },
  },
  required: [
    "intent",
    "topic",
    "potentialCustomer",
    "confidence",
    "riskTier",
    "riskReasoning",
    "recommendedAction",
    "draftReply",
    "reasoning",
  ],
};

export interface CommunityAgentItemResult {
  mentionId: string;
  ok: boolean;
  error?: string;
}

export async function runCommunityAgentOnMention(mentionId: string): Promise<CommunityAgentItemResult> {
  const mention = await prisma.mockMention.findUnique({ where: { id: mentionId } });
  if (!mention) return { mentionId, ok: false, error: "Mention not found" };

  const existing = await prisma.conversation.findUnique({ where: { sourceMentionId: mentionId } });
  if (existing) return { mentionId, ok: true };

  let analysis: z.infer<typeof analysisSchema>;
  try {
    analysis = await callStructuredClaude({
      toolName: "record_conversation_analysis",
      toolDescription:
        "Records intent analysis and a draft reply for a social mention, including a risk self-assessment.",
      inputSchema,
      zodSchema: analysisSchema,
      userMessage: `Analyze this X mention and decide whether/how to reply.

Author: @${mention.authorHandle} (${mention.authorName})
Text: "${mention.text}"
Likes: ${mention.likes}, Replies: ${mention.replyCount}

Score the intent, identify the topic, decide if this looks like a potential OnSight customer,
self-assess the risk tier, and draft a reply if appropriate.`,
    });
  } catch (err) {
    // Fail-safe invariant: if classification errors for any reason (rate
    // limit, billing, timeout, refusal), nothing risky may be auto-approved
    // — but that only requires NOT creating a draft/approval here, not
    // permanently flagging the mention. Leaving no Conversation record means
    // the mention stays eligible for reprocessing on the next cycle, the
    // same retry behavior the Trend Agent already uses. A genuinely
    // content-driven refusal will just fail the same way again next time,
    // which is a wasted call, not a safety issue.
    const message = err instanceof ClaudeRefusalError ? err.message : String(err);
    return { mentionId, ok: false, error: message };
  }

  const { tier, matchedKeywords } = resolveRiskTier(mention.text, analysis.riskTier);
  const isNever = tier === "NEVER";

  const conversation = await prisma.conversation.create({
    data: {
      sourceMentionId: mention.id,
      authorHandle: mention.authorHandle,
      authorName: mention.authorName,
      originalText: mention.text,
      likes: mention.likes,
      replyCount: mention.replyCount,
      intent: analysis.intent,
      topic: analysis.topic,
      potentialCustomer: analysis.potentialCustomer,
      riskTier: tier,
      matchedKeywords: matchedKeywords.length ? matchedKeywords.join(", ") : null,
      aiRiskReasoning: analysis.riskReasoning,
      aiDraftReply: isNever ? null : analysis.draftReply,
      recommendedAction: isNever
        ? "Flagged — do not auto-draft. Requires manual review."
        : analysis.recommendedAction,
      status: isNever ? "NEW" : analysis.draftReply ? "DRAFTED" : "NEW",
    },
  });

  if (!isNever && analysis.draftReply) {
    await prisma.approval.create({
      data: {
        type: "REPLY",
        platform: "X",
        content: analysis.draftReply,
        aiReasoning: analysis.reasoning,
        confidence: analysis.confidence,
        riskTier: tier,
        conversationId: conversation.id,
      },
    });
  }

  return { mentionId, ok: true };
}

export async function runCommunityAgent(): Promise<CommunityAgentItemResult[]> {
  const unprocessed = await prisma.mockMention.findMany({
    where: { conversation: null },
    select: { id: true },
  });

  const results: CommunityAgentItemResult[] = [];
  for (const mention of unprocessed) {
    results.push(await runCommunityAgentOnMention(mention.id));
  }
  return results;
}
