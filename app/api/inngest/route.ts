import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { agentCycleFn } from "@/lib/inngest/functions/agent-cycle";

// Each Inngest step executes as its own call into this route — without an
// explicit maxDuration, Vercel's short default (10s on Hobby) can kill a
// slow step (e.g. the live web-search stage) before it finishes, surfacing
// as a step failure/retry rather than the step actually completing slowly.
export const maxDuration = 60;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [agentCycleFn],
});
