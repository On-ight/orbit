import { prisma } from "@/lib/db/prisma";
import { RunCycleButton } from "@/components/settings/RunCycleButton";
import { KnowledgeBaseManager } from "@/components/settings/KnowledgeBaseManager";
import { isXConfigured } from "@/lib/publishing/x-client";
import { isBufferConfigured, isBufferConfiguredForPlatform } from "@/lib/publishing/buffer-client";
import { PLATFORMS } from "@/lib/types";

export const dynamic = "force-dynamic";

const TIER_GROUPS: { tier: string; label: string; color: string; actions: string[] }[] = [
  {
    tier: "AUTO",
    label: "🟢 Auto — the AI just does it",
    color: "var(--status-good)",
    actions: [
      "Collect trends",
      "Analyze posts",
      "Analyze engagement",
      "Categorize conversations",
      "Generate drafts",
      "Generate analytics",
      "Identify potential community members",
    ],
  },
  {
    tier: "APPROVAL",
    label: "🟡 Approval — the AI asks you",
    color: "var(--status-warning)",
    actions: ["Publish post (X/Threads/LinkedIn)", "Reply to someone", "Send community invitation", "Sensitive conversation"],
  },
  {
    tier: "NEVER",
    label: "🔴 Never autonomous — always flagged for you",
    color: "var(--status-critical)",
    actions: [
      "Political or controversial topics",
      "Complaints",
      "Accusations",
      "Brand reputation issues",
      "Unverified safety claims",
    ],
  },
];

const PLATFORM_LABEL: Record<string, string> = { X: "X (Twitter)", THREADS: "Threads", LINKEDIN: "LinkedIn" };

export default async function SettingsPage() {
  const [runs, hasApiKey, xConfigured, bufferConfigured, knowledgeBaseEntries] = await Promise.all([
    prisma.agentRun.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
    Promise.resolve(Boolean(process.env.ANTHROPIC_API_KEY)),
    Promise.resolve(isXConfigured()),
    Promise.resolve(isBufferConfigured()),
    prisma.knowledgeBaseEntry.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Settings</h1>

      <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Connections</h2>
        <div className="space-y-2 text-xs">
          <p>
            Claude API key:{" "}
            <span
              className="font-medium"
              style={{ color: hasApiKey ? "var(--status-good)" : "var(--status-critical)" }}
            >
              {hasApiKey ? "configured" : "missing — set ANTHROPIC_API_KEY in .env.local"}
            </span>
          </p>
          <div>
            <p className="mb-1">
              Buffer:{" "}
              <span
                className="font-medium"
                style={{ color: bufferConfigured ? "var(--status-good)" : "var(--text-muted)" }}
              >
                {bufferConfigured ? "connected" : "not connected"}
              </span>
            </p>
            <ul className="ml-4 list-disc space-y-0.5 text-[var(--text-secondary)]">
              {PLATFORMS.map((p) => {
                const connected = isBufferConfiguredForPlatform(p);
                return (
                  <li key={p}>
                    {PLATFORM_LABEL[p]}:{" "}
                    <span style={{ color: connected ? "var(--status-good)" : "var(--text-muted)" }}>
                      {connected ? "channel connected" : "not connected"}
                    </span>
                  </li>
                );
              })}
            </ul>
            {!bufferConfigured && (
              <p className="mt-1 text-[var(--text-muted)]">
                Set BUFFER_API_KEY plus BUFFER_X_CHANNEL_ID / BUFFER_THREADS_CHANNEL_ID /
                BUFFER_LINKEDIN_CHANNEL_ID in .env.local (run{" "}
                <code className="text-[var(--text-secondary)]">npm run buffer:channels</code> to find
                each id). Buffer takes priority over direct X posting per-platform, and is the only
                path with real scheduling, Threads, and LinkedIn image attachment.
              </p>
            )}
          </div>
          <p>
            X (Twitter) direct:{" "}
            <span
              className="font-medium"
              style={{ color: xConfigured ? "var(--status-good)" : "var(--text-muted)" }}
            >
              {xConfigured
                ? isBufferConfiguredForPlatform("X")
                  ? "connected — unused while Buffer's X channel is connected"
                  : "connected — approved posts publish live, immediately"
                : "not connected — approved posts stay simulated"}
            </span>
            {!xConfigured && (
              <span className="block text-[var(--text-muted)]">
                Set X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET in .env.local
                (OAuth 1.0a user-context credentials from the X Developer Portal, app
                permissions set to Read and Write). Only used for posts, and only when
                Buffer isn&apos;t connected for X specifically.
              </span>
            )}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
        <h2 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">Run agent cycle</h2>
        <p className="mb-4 text-xs text-[var(--text-muted)]">
          Runs automatically every morning at 6am IST via a Vercel cron job (look for{" "}
          <span className="font-medium text-[var(--text-secondary)]">CRON</span>-triggered runs
          below). You can also trigger one manually any time — the Trend, Content, and Community
          agents will process whatever&apos;s new, including fresh live-web-search trend research.
        </p>
        <RunCycleButton />
      </section>

      <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Recent runs</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No runs yet.</p>
        ) : (
          <ul className="space-y-2">
            {runs.map((run) => (
              <li key={run.id} className="text-xs text-[var(--text-secondary)]">
                <span
                  className="font-medium"
                  style={{
                    color:
                      run.status === "COMPLETED"
                        ? "var(--status-good)"
                        : run.status === "FAILED"
                          ? "var(--status-critical)"
                          : "var(--status-warning)",
                  }}
                >
                  {run.status}
                </span>{" "}
                · {new Date(run.startedAt).toLocaleString()} · {run.summary ?? "in progress"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
          Autonomy policy
        </h2>
        <div className="space-y-4">
          {TIER_GROUPS.map((group) => (
            <div key={group.tier}>
              <p className="mb-1.5 text-sm font-medium" style={{ color: group.color }}>
                {group.label}
              </p>
              <ul className="ml-4 list-disc space-y-0.5 text-xs text-[var(--text-secondary)]">
                {group.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
        <h2 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">Knowledge base</h2>
        <p className="mb-4 text-xs text-[var(--text-muted)]">
          Grounds trend research and drafting — brand voice, content pillars, safety rules, product
          status. Edits here take effect on the next agent cycle, no redeploy needed.
        </p>
        <KnowledgeBaseManager entries={knowledgeBaseEntries} />
      </section>
    </div>
  );
}
