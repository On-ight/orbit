import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { inngest, AGENT_CYCLE_REQUESTED } from "@/lib/inngest/client";
import { AGENT_CYCLE_TIME_SLOTS } from "@/lib/types";
import { expireAllOverdueTrials } from "@/lib/billing/trial";

// This route only enqueues work now — the actual agent cycles run as
// durable Inngest functions (lib/inngest/functions/agent-cycle.ts), each
// isolated per account with its own retries, so this no longer needs a
// long timeout.
export const maxDuration = 10;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  // Fail closed: reject if the secret is simply unset, not just on a
  // mismatch — an unset env var must never accidentally let a bare
  // "Bearer undefined" through.
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Each fixed vercel.json cron entry hits this route with its own `slot`
  // — accounts only run in the cycle matching their own chosen time, since
  // Vercel fires at fixed schedules, not per-account ones. Default to the
  // original slot so an un-parameterized hit (e.g. a manual test) still
  // does something reasonable rather than silently matching nothing.
  const slotParam = request.nextUrl.searchParams.get("slot");
  const slot = (AGENT_CYCLE_TIME_SLOTS as readonly string[]).includes(slotParam ?? "")
    ? (slotParam as string)
    : "06:00";

  // Catches accounts nobody has logged into since their trial ended — the
  // lazy per-request check in getCurrentUser() only fires for accounts
  // someone is actively browsing.
  await expireAllOverdueTrials();

  // MANUAL accounts never run on cron, only via the "Run agent cycle"
  // button — cron is exclusively for accounts that opted into AUTOMATIC.
  const activeAccounts = await prisma.account.findMany({
    where: { subscriptionStatus: "active", cycleMode: "AUTOMATIC", agentCycleTimeSlot: slot },
    select: { id: true },
  });

  if (activeAccounts.length > 0) {
    // One event per account — Inngest fans these out to isolated function
    // runs, so one tenant's failure/retry can't block or slow anyone else's.
    await inngest.send(
      activeAccounts.map((account) => ({
        name: AGENT_CYCLE_REQUESTED,
        data: { accountId: account.id, triggeredBy: "CRON" as const },
      })),
    );
  }

  return NextResponse.json({ slot, accountsEnqueued: activeAccounts.length });
}
