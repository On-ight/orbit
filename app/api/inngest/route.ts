import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { agentCycleFn } from "@/lib/inngest/functions/agent-cycle";
import { reelPipelineFn } from "@/lib/inngest/functions/reel-pipeline";
import { instagramPublishFn } from "@/lib/inngest/functions/instagram-publish";
import { threadsPublishFn } from "@/lib/inngest/functions/threads-publish";

// Each Inngest step executes as its own call into this route — without an
// explicit maxDuration, Vercel's short default (10s on Hobby) can kill a
// slow step (e.g. the live web-search stage) before it finishes, surfacing
// as a step failure/retry rather than the step actually completing slowly.
// Raised from 60 to 300 after real FUNCTION_INVOCATION_TIMEOUT failures —
// a Groq 429 now retries against a second API key (lib/agents/llm-client.ts),
// each attempt with its own backoff, which can push a single step well
// past 60s under sustained rate-limiting. 300s requires a Vercel plan
// above Hobby (which hard-caps at 60s regardless of this value).
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [agentCycleFn, reelPipelineFn, instagramPublishFn, threadsPublishFn],
});
