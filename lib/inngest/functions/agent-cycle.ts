import { prisma } from "@/lib/db/prisma";
import { discoverTrends } from "@/lib/agents/discover-trends";
import { discoverMentions } from "@/lib/agents/discover-mentions";
import { runTrendAgent } from "@/lib/agents/trend-agent";
import { runContentAgent } from "@/lib/agents/content-agent";
import { runCommunityAgent } from "@/lib/agents/community-agent";
import { inngest, AGENT_CYCLE_REQUESTED, type AgentCycleRequestedData } from "@/lib/inngest/client";

/**
 * Durable replacement for lib/agents/run-cycle.ts's runAgentCycle(): same 5
 * stages, same order, same per-stage failure isolation (one stage crashing
 * doesn't block the next), but each stage is now a step.run() — Inngest
 * memoizes completed steps, so a crash-and-resume only re-executes the
 * incomplete step, not earlier ones. The try/catch stays wrapped around each
 * step.run() call rather than relying on Inngest's default retry-then-fail
 * behavior, so a stage that exhausts its own retries still lets the next
 * stage proceed, exactly like today.
 */
export const agentCycleFn = inngest.createFunction(
  {
    id: "agent-cycle",
    // Bounds total simultaneous account cycles against the single shared
    // Groq API key across all tenants.
    concurrency: { limit: 10 },
    retries: 2,
    triggers: [{ event: AGENT_CYCLE_REQUESTED }],
  },
  async ({ event, step }) => {
    const { accountId, triggeredBy } = event.data as AgentCycleRequestedData;

    const run = await step.run("create-agent-run", () =>
      prisma.agentRun.create({ data: { accountId, triggeredBy, status: "RUNNING" } }),
    );

    const kbCount = await step.run("check-knowledge-base", () =>
      prisma.knowledgeBaseEntry.count({ where: { accountId } }),
    );

    if (kbCount === 0) {
      const summary = "Skipped — no knowledge base entries yet. Add at least one in Settings first.";
      await step.run("finalize-skipped", () =>
        prisma.agentRun.update({
          where: { id: run.id },
          data: { status: "FAILED", summary, completedAt: new Date() },
        }),
      );
      return { agentRunId: run.id, status: "FAILED", summary };
    }

    const parts: string[] = [];
    let hadError = false;

    try {
      const discovery = await step.run("discover-trends", () => discoverTrends(accountId, run.id));
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
      const trendResults = await step.run("run-trend-agent", () => runTrendAgent(accountId));
      const trendFailures = trendResults.filter((r) => !r.ok).length;
      parts.push(`Trend Agent: ${trendResults.length} processed, ${trendFailures} failed`);
    } catch (err) {
      hadError = true;
      parts.push(`Trend Agent crashed: ${String(err)}`);
    }

    try {
      const contentResults = await step.run("run-content-agent", () => runContentAgent(accountId));
      const contentFailures = contentResults.filter((r) => !r.ok).length;
      parts.push(`Content Agent: ${contentResults.length} processed, ${contentFailures} failed`);
    } catch (err) {
      hadError = true;
      parts.push(`Content Agent crashed: ${String(err)}`);
    }

    try {
      const mentionDiscovery = await step.run("discover-mentions", () => discoverMentions(accountId));
      parts.push(
        mentionDiscovery.ok
          ? `Mention Discovery: ${mentionDiscovery.created} new mention(s) found`
          : `Mention Discovery failed: ${mentionDiscovery.error}`,
      );
    } catch (err) {
      hadError = true;
      parts.push(`Mention Discovery crashed: ${String(err)}`);
    }

    try {
      const communityResults = await step.run("run-community-agent", () => runCommunityAgent(accountId));
      const communityFailures = communityResults.filter((r) => !r.ok).length;
      parts.push(`Community Agent: ${communityResults.length} processed, ${communityFailures} failed`);
    } catch (err) {
      hadError = true;
      parts.push(`Community Agent crashed: ${String(err)}`);
    }

    const summary = parts.join(" | ");
    const status = hadError ? "FAILED" : "COMPLETED";

    await step.run("finalize-agent-run", () =>
      prisma.agentRun.update({ where: { id: run.id }, data: { status, summary, completedAt: new Date() } }),
    );

    return { agentRunId: run.id, status, summary };
  },
);
