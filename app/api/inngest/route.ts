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
// past 60s under sustained rate-limiting. Currently a no-op in practice:
// this account is on Vercel's Hobby plan, which hard-caps every function
// at 60s regardless of this value — kept at 300 so it takes effect
// automatically on upgrade, with no code change needed. Re-enabling
// discover-trends.ts's per-day attempt cap is the lever that actually
// helps on Hobby today, by making the slow call itself rarer.
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [agentCycleFn, reelPipelineFn, instagramPublishFn, threadsPublishFn],
});
