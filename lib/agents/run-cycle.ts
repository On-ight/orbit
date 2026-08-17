import { prisma } from "@/lib/db/prisma";
import { runTrendAgent } from "@/lib/agents/trend-agent";
import { runContentAgent } from "@/lib/agents/content-agent";
import { runCommunityAgent } from "@/lib/agents/community-agent";

export interface AgentRunResult {
  agentRunId: string;
  status: "COMPLETED" | "FAILED";
  summary: string;
}

/**
 * Transport-agnostic orchestration entrypoint — no dependency on
 * Request/Response, so it can be called identically from a manual API
 * route (v1), a future cron-triggered route, or a queue worker, without
 * touching this function.
 *
 * Each agent already isolates failures per-item internally; this function
 * additionally isolates failures per-agent so one agent's total failure
 * doesn't prevent the others from running.
 */
export async function runAgentCycle(triggeredBy: "MANUAL" | "CRON" = "MANUAL"): Promise<AgentRunResult> {
  const run = await prisma.agentRun.create({
    data: { triggeredBy, status: "RUNNING" },
  });

  const parts: string[] = [];
  let hadError = false;

  try {
    const trendResults = await runTrendAgent();
    const trendFailures = trendResults.filter((r) => !r.ok).length;
    parts.push(`Trend Agent: ${trendResults.length} processed, ${trendFailures} failed`);
  } catch (err) {
    hadError = true;
    parts.push(`Trend Agent crashed: ${String(err)}`);
  }

  try {
    const contentResults = await runContentAgent();
    const contentFailures = contentResults.filter((r) => !r.ok).length;
    parts.push(`Content Agent: ${contentResults.length} processed, ${contentFailures} failed`);
  } catch (err) {
    hadError = true;
    parts.push(`Content Agent crashed: ${String(err)}`);
  }

  try {
    const communityResults = await runCommunityAgent();
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
