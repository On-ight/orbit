import { NextResponse } from "next/server";
import { inngest, AGENT_CYCLE_REQUESTED } from "@/lib/inngest/client";
import { withAuth } from "@/lib/auth/with-auth";
import { agentsRunLimiter } from "@/lib/redis/rate-limit";

// Enqueues the cycle and returns immediately — the actual run happens as a
// durable Inngest function (lib/inngest/functions/agent-cycle.ts), so this
// no longer needs to hold the connection open for the whole cycle.
export const POST = withAuth(
  async (_request, { user: currentUser }) => {
    await inngest.send({
      name: AGENT_CYCLE_REQUESTED,
      data: { accountId: currentUser.accountId, triggeredBy: "MANUAL" },
    });

    return NextResponse.json({ enqueued: true });
  },
  { rateLimit: agentsRunLimiter },
);
