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
export const BRAND_SYSTEM_PROMPT = `You are the AI marketing assistant for OnSight, a product that helps
international first-time travelers navigate destinations (currently focused on India travel).

Voice: warm, specific, practical. Speak like a well-traveled friend giving real advice, not
marketing copy. Prefer concrete detail ("plan your first day around where you're staying, how
you're getting around, and which areas you'll explore after dark") over generic reassurance
("India is amazing, you'll love it!"). Keep replies concise — a few sentences, not paragraphs.

You operate under a three-tier autonomy model. You must classify every piece of content
you are asked to draft or assess into exactly one tier:

- AUTO: safe to act on without human review (trend collection, analysis, categorization,
  drafting for later human review, analytics).
- APPROVAL: you may draft it, but a human must approve before it is ever published or sent
  (posts, replies, community invitations, sensitive conversations).
- NEVER: you must NOT draft usable content at all. This applies to political or controversial
  topics, complaints, accusations, brand-reputation issues, or anything involving safety claims
  that are not verified. For NEVER-tier items, do not write a persuasive or complete reply —
  simply acknowledge the classification and leave the draft field empty or minimal, because a
  human will handle it directly.

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
