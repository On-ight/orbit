import Groq from "groq-sdk";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

// Structured tool-calling model. gpt-oss-120b is Groq's flagship for
// reasoning + reliable JSON/tool-call output.
export const LLM_MODEL = "openai/gpt-oss-120b";

// Same model, used with the browser_search built-in tool for the free-form
// research call below. Browser search is only available on the gpt-oss family.
const WEB_SEARCH_MODEL = "openai/gpt-oss-120b";

let client: Groq | null = null;

function getClient(): Groq {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set");
    client = new Groq({ apiKey, maxRetries: 2 });
  }
  return client;
}

// Brand-agnostic — applies to every tenant regardless of what business they
// run. Each account's own brand voice/positioning/content pillars come from
// their KnowledgeBaseEntry rows, combined in via buildSystemPrompt() below.
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

export class LlmRefusalError extends Error {
  constructor(message = "The model refused to generate a response for this item") {
    super(message);
    this.name = "LlmRefusalError";
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
 * Forces the model to respond via a single tool call so we get typed JSON
 * back instead of parsing free text. The result is validated against
 * zodSchema before being returned — if either the tool call or validation
 * fails, this throws and the caller (lib/inngest/functions/agent-cycle.ts) is responsible for
 * per-item isolation and failing safe on risk classification.
 */
export async function callStructuredCompletion<T>(args: StructuredCallArgs<T>): Promise<T> {
  const groq = getClient();

  const response = await groq.chat.completions.create({
    model: LLM_MODEL,
    max_completion_tokens: args.maxTokens ?? 1024,
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: args.userMessage },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: args.toolName,
          description: args.toolDescription,
          parameters: args.inputSchema,
        },
      },
    ],
    tool_choice: { type: "function", function: { name: args.toolName } },
  });

  const choice = response.choices[0];
  const toolCall = choice.message.tool_calls?.[0];

  if (!toolCall) {
    // tool_choice was forced, so "stop" with no tool call means the model
    // declined to comply (Groq's closest equivalent to a refusal) rather
    // than just running out of tokens.
    if (choice.finish_reason === "stop") {
      throw new LlmRefusalError();
    }
    throw new Error(`Model did not return a tool call (finish_reason: ${choice.finish_reason})`);
  }

  const parsedArgs: unknown = JSON.parse(toolCall.function.arguments);
  return args.zodSchema.parse(parsedArgs);
}

interface WebSearchArgs {
  userMessage: string;
  system: string; // required — callers parameterize this per account, no generic default
  maxSearches?: number;
}

/**
 * Free-form research call using Groq's built-in browser_search tool
 * (gpt-oss-120b only). Deliberately separate from callStructuredCompletion's
 * forced tool_choice — browser_search is documented as incompatible with
 * structured outputs, so this returns plain text; callers extract structured
 * data from it in a second call. Returns null (not an error) when the model
 * didn't produce a normal end-of-turn answer — callers should treat that as
 * "nothing found this cycle."
 */
export async function researchWithWebSearch(args: WebSearchArgs): Promise<string | null> {
  const groq = getClient();

  const response = await groq.chat.completions.create({
    model: WEB_SEARCH_MODEL,
    max_completion_tokens: 2048,
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: args.userMessage },
    ],
    tools: [{ type: "browser_search" }],
    tool_choice: "required",
  });

  const choice = response.choices[0];
  if (choice.finish_reason !== "stop") {
    return null;
  }

  const text = choice.message.content?.trim();
  return text || null;
}
