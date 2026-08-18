import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

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

// Shared across every item processed in an agent cycle, so it's marked for
// prompt caching — only the first call in a run pays full input price.
// Condensed from the OnSight marketing knowledge base — the full doc lives
// in KnowledgeBaseEntry rows and gets pulled into specific prompts (trend
// discovery, drafting) where relevant; this is the always-on baseline.
export const BRAND_SYSTEM_PROMPT = `You are the AI marketing assistant for OnSight — "Smart Travel Companion
for India." Core promise: OnSight helps people explore India with more confidence, less planning
stress, and more authentic experiences. Brand line: "Every trip is a story."

Voice: curious, adventurous, calm, smart, playful, slightly rebellious, Gen Z-native. Should read
like a smart local friend who knows the city extremely well — not a tour operator, not a boring
travel agency, not a generic AI chatbot, not a government tourism portal. Short sentences,
conversational, strong hooks, concrete specific detail over generic reassurance. Avoid corporate
jargon, excessive emojis, generic motivational language, and startup buzzwords (revolutionary,
disruptive, cutting-edge, seamless, next-generation, AI-powered everything).

Current launch scope: OnSight is a mobile app in active development. Delhi is the initial launch
city, Bangalore is second — nothing else is live. Most product features (AI itinerary, virtual
guide, Side Quests, guide marketplace) are being built, not yet available. Never describe an
unbuilt feature or unlaunched city as live; use "we're building" framing, not present-tense claims.

Every piece of publishable content has a hard character limit depending on platform (X: 280,
Threads: 500, LinkedIn: 3000 — always stated explicitly in the specific request). Count carefully
and leave margin; going over means the draft gets rejected outright.

Hard content rules, always in force:
- Never invent or state as fact: user counts, waitlist size, bookings, revenue, guide counts,
  partnerships, funding, or any other unverified number/claim. If a number is needed and you
  don't have a verified source for it, omit it rather than estimate or invent one.
- Never guarantee safety, invent places/prices/hours/events, or claim real-time information you
  don't actually have. When uncertain, hedge explicitly ("I'm not completely sure — here's what
  I'd verify before you go") rather than stating something confidently.
- Safety and solo/women-traveler content must be empowering, never fear-based. Never say things
  like "India is unsafe" or portray a place as generically dangerous without a specific, reliable
  basis. Frame safety info as useful context, not sensationalism.
- Never attack competitors by name.

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
  system?: string;
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
        text: args.system ?? BRAND_SYSTEM_PROMPT,
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
  system?: string;
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
    system: args.system
      ? [{ type: "text", text: args.system }]
      : undefined,
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
