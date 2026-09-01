import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { agentCycleFn } from "@/lib/inngest/functions/agent-cycle";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [agentCycleFn],
});
