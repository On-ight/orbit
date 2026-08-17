import OpenAI from "openai";
import { z } from "zod";

// "Terra" is OpenAI's balanced mid-tier — good enough quality for on-brand
// drafting without paying flagship ("Sol") prices. "Luna" is the
// cost-optimized tier if this needs to get cheaper; swap the constant below.
export const LLM_MODEL = "gpt-5.6-luna";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    client = new OpenAI({ apiKey, maxRetries: 2 });
  }
  return client;
}

// Shared across every item processed in an agent cycle.
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

export class LLMRefusalError extends Error {
  constructor(message = "The model refused to generate a response for this item") {
    super(message);
    this.name = "LLMRefusalError";
  }
}

interface StructuredCallArgs<T> {
  userMessage: string;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
  zodSchema: z.ZodType<T>;
  system?: string;
}

/**
 * Forces a single function call so we get typed JSON back instead of
 * parsing free text. The result is validated against zodSchema before being
 * returned — if either the call or validation fails, this throws and the
 * caller (run-cycle.ts / agents) is responsible for per-item isolation and
 * failing safe on risk classification.
 */
export async function callStructuredLLM<T>(args: StructuredCallArgs<T>): Promise<T> {
  const openai = getClient();

  const completion = await openai.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: "system", content: args.system ?? BRAND_SYSTEM_PROMPT },
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

  const choice = completion.choices[0];

  if (choice.finish_reason === "content_filter") {
    throw new LLMRefusalError();
  }

  const toolCall = choice.message.tool_calls?.[0];
  if (!toolCall || toolCall.type !== "function") {
    throw new Error("Model did not return a function call");
  }

  const parsedArgs = JSON.parse(toolCall.function.arguments);
  return args.zodSchema.parse(parsedArgs);
}
