import { prisma } from "@/lib/db/prisma";
import { discoverTrends } from "@/lib/agents/discover-trends";
import { runTrendAgent } from "@/lib/agents/trend-agent";
import { runContentAgent } from "@/lib/agents/content-agent";
import { runCommunityAgent } from "@/lib/agents/community-agent";

export interface AgentRunResult {
  agentRunId: string;
  status: "COMPLETED" | "FAILED";
  summary: string;
}

/**
 * Transport-agnostic orchestration entrypoint for ONE account — no
 * dependency on Request/Response, so it can be called identically from a
 * manual API route, the daily cron route (which iterates every active
 * account and calls this once per account, isolated), or a future queue
 * worker, without touching this function.
 *
 * Each agent already isolates failures per-item internally; this function
 * additionally isolates failures per-agent so one agent's total failure
 * doesn't prevent the others from running for this account.
 */
export async function runAgentCycle(
  accountId: string,
  triggeredBy: "MANUAL" | "CRON" = "MANUAL",
): Promise<AgentRunResult> {
  const run = await prisma.agentRun.create({
    data: { accountId, triggeredBy, status: "RUNNING" },
  });

  const parts: string[] = [];
  let hadError = false;

  try {
    const discovery = await discoverTrends(accountId);
    parts.push(
      discovery.ok
        ? `Trend Discovery: ${discovery.created} new trend(s) found`
        : `Trend Discovery failed: ${discovery.error}`,
    );
  } catch (err) {
    hadError = true;
    parts.push(`Trend Discovery crashed: ${String(err)}`);
  }

  try {
    const trendResults = await runTrendAgent(accountId);
    const trendFailures = trendResults.filter((r) => !r.ok).length;
    parts.push(`Trend Agent: ${trendResults.length} processed, ${trendFailures} failed`);
  } catch (err) {
    hadError = true;
    parts.push(`Trend Agent crashed: ${String(err)}`);
  }

  try {
    const contentResults = await runContentAgent(accountId);
    const contentFailures = contentResults.filter((r) => !r.ok).length;
    parts.push(`Content Agent: ${contentResults.length} processed, ${contentFailures} failed`);
  } catch (err) {
    hadError = true;
    parts.push(`Content Agent crashed: ${String(err)}`);
  }

  try {
    const communityResults = await runCommunityAgent(accountId);
    const communityFailures = communityResults.filter((r) => !r.ok).length;
    parts.push(`Community Agent: ${communityResults.length} processed, ${communityFailures} failed`);
  } catch (err) {
    hadError = true;
    parts.push(`Community Agent crashed: ${String(err)}`);
  }

  const summary = parts.join(" | ");
  const status = hadError ? "FAILED" : "COMPLETED";

  await prisma.agentRun.update({
    where: { id: run.id },
    data: {
      status,
      summary,
      completedAt: new Date(),
    },
  });

  return { agentRunId: run.id, status, summary };
}
