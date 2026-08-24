import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

export const CLAUDE_MODEL = "claude-sonnet-5";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey, maxRetries: 2 });
  }
  return client;
}

// Brand-agnostic — applies to every tenant regardless of what business they
// run. Each account's own brand voice/positioning/content pillars come from
// their KnowledgeBaseEntry rows, combined in via buildSystemPrompt() below.
// Shared across every item processed in an agent cycle, so it's marked for
// prompt caching — only the first call per account in a run pays full price.
export const PLATFORM_SAFETY_PROMPT = `You are an AI marketing assistant drafting social content on behalf of a
business. Follow the brand voice, positioning, and content guidance supplied separately as
additional context for this specific business — this prompt only covers rules that apply
regardless of which business you're writing for.

Every piece of publishable content has a hard character limit depending on platform (X: 280,
Threads: 500, LinkedIn: 3000 — always stated explicitly in the specific request). Count carefully
and leave margin; going over means the draft gets rejected outright.

Hard content rules, always in force:
- Never invent or state as fact: user counts, waitlist size, bookings, revenue, partnerships,
  funding, or any other unverified number/claim. If a number is needed and you don't have a
  verified source for it, omit it rather than estimate or invent one.
- Never guarantee safety, invent facts/prices/hours/events, or claim real-time information you
  don't actually have. When uncertain, hedge explicitly ("I'm not completely sure — here's what
  I'd verify") rather than stating something confidently.
- Safety-adjacent content must be empowering, never fear-based or sensational. Never portray a
  place, group, or situation as generically dangerous without a specific, reliable basis.
- Never attack competitors by name.
- Never describe an unlaunched feature, market, or product capability as already live — use
  "we're building" framing for anything not actually shipped, per the business's own product status
  (stated in their own brand context, not assumed).

You operate under a three-tier autonomy model. You must classify every piece of content
you are asked to draft or assess into exactly one tier:

- AUTO: safe to act on without human review (trend collection, analysis, categorization,
  drafting for later human review, analytics).
- APPROVAL: you may draft it, but a human must approve before it is ever published or sent
  (posts, replies, community invitations, sensitive conversations).
- NEVER: you must NOT draft usable content at all. This applies to political or controversial
  topics, complaints, accusations, brand-reputation issues, unverified safety claims, AND any of
  the fabricated-number/unverified-claim cases above — a confidently-stated false number is the
  same failure mode as a confidently-stated false safety claim. For NEVER-tier items, do not
  write a persuasive or complete draft — simply acknowledge the classification and leave the
  draft field empty or minimal, because a human will handle it directly.

Always err toward the more conservative tier when uncertain.`;

/**
 * Combines the universal platform-safety rules with this specific account's
 * own brand voice/content knowledge base. Every agent call must build its
 * system prompt through this rather than using PLATFORM_SAFETY_PROMPT alone,
 * so a tenant's content actually reflects their brand, not a generic voice.
 */
export async function buildSystemPrompt(accountId: string): Promise<string> {
  const entries = await prisma.knowledgeBaseEntry.findMany({
    where: { accountId },
    orderBy: { createdAt: "asc" },
  });

  if (entries.length === 0) return PLATFORM_SAFETY_PROMPT;

  const kbContext = entries.map((e) => `## ${e.title}\n${e.content}`).join("\n\n");
  return `${PLATFORM_SAFETY_PROMPT}

---

The following is this business's own brand voice, positioning, and content guidance. Follow it
closely for tone and substance, within the hard rules above:

${kbContext}`;
}

export class ClaudeRefusalError extends Error {
  constructor(message = "Claude refused to generate a response for this item") {
    super(message);
    this.name = "ClaudeRefusalError";
  }
}

interface StructuredCallArgs<T> {
  userMessage: string;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
  zodSchema: z.ZodType<T>;
  // Required, not defaulted — every caller must build this via
  // buildSystemPrompt(accountId) so content reflects that tenant's own brand,
  // never a silent fallback to someone else's voice.
  system: string;
  maxTokens?: number;
}

/**
 * Forces Claude to respond via a single tool call so we get typed JSON back
 * instead of parsing free text. The result is validated against zodSchema
 * before being returned — if either the tool call or validation fails, this
 * throws and the caller (run-cycle.ts) is responsible for per-item isolation
 * and failing safe on risk classification.
 */
export async function callStructuredClaude<T>(args: StructuredCallArgs<T>): Promise<T> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: args.maxTokens ?? 1024,
    system: [
      {
        type: "text",
        text: args.system,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: args.userMessage }],
    tools: [
      {
        name: args.toolName,
        description: args.toolDescription,
        input_schema: args.inputSchema as Anthropic.Tool["input_schema"],
      },
    ],
    tool_choice: { type: "tool", name: args.toolName },
  });

  if (response.stop_reason === "refusal") {
    throw new ClaudeRefusalError();
  }

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );

  if (!toolUse) {
    throw new Error("Claude did not return a tool_use block");
  }

  return args.zodSchema.parse(toolUse.input);
}

interface WebSearchArgs {
  userMessage: string;
  system: string; // required — callers parameterize this per account, no generic default
  maxSearches?: number;
}

/**
 * Free-form research call using Anthropic's native web_search server tool.
 * Deliberately NOT combined with callStructuredClaude's forced tool_choice —
 * forcing a specific tool blocks the model from taking a search turn first,
 * so this returns plain text; callers extract structured data from it in a
 * second call. Returns null (not an error) when the model didn't produce a
 * normal end-of-turn answer (e.g. paused mid-search, refused, or ran out of
 * budget) — callers should treat that as "nothing found this cycle."
 */
export async function researchWithWebSearch(args: WebSearchArgs): Promise<string | null> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: [{ type: "text", text: args.system }],
    messages: [{ role: "user", content: args.userMessage }],
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: args.maxSearches ?? 5,
      },
    ],
  });

  if (response.stop_reason !== "end_turn") {
    return null;
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return text || null;
}
