import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { runAgentCycle } from "@/lib/agents/run-cycle";

// Web search + multi-platform drafting makes a cycle meaningfully longer
// than the original X-only version — give it real headroom.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  // Fail closed: reject if the secret is simply unset, not just on a
  // mismatch — an unset env var must never accidentally let a bare
  // "Bearer undefined" through.
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeAccounts = await prisma.account.findMany({
    where: { subscriptionStatus: "active" },
    select: { id: true, name: true },
  });

  const results: { accountId: string; status: string; error?: string }[] = [];

  for (const account of activeAccounts) {
    // Isolated per account — one tenant's Claude/Buffer failure must not
    // block the daily cycle for anyone else.
    try {
      const result = await runAgentCycle(account.id, "CRON");
      results.push({ accountId: account.id, status: result.status });
    } catch (err) {
      results.push({ accountId: account.id, status: "FAILED", error: String(err) });
    }
  }

  return NextResponse.json({ accountsProcessed: activeAccounts.length, results });
}
