import { prisma } from "@/lib/db/prisma";
import { RunCycleButton } from "@/components/settings/RunCycleButton";
import { isXConfigured } from "@/lib/publishing/x-client";

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
    actions: ["Publish X post", "Reply to someone", "Send community invitation", "Sensitive conversation"],
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

export default async function SettingsPage() {
  const [runs, hasApiKey, xConfigured] = await Promise.all([
    prisma.agentRun.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
    Promise.resolve(Boolean(process.env.OPENAI_API_KEY)),
    Promise.resolve(isXConfigured()),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Settings</h1>

      <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Connections</h2>
        <div className="space-y-2 text-xs">
          <p>
            OpenAI API key:{" "}
            <span
              className="font-medium"
              style={{ color: hasApiKey ? "var(--status-good)" : "var(--status-critical)" }}
            >
              {hasApiKey ? "configured" : "missing — set OPENAI_API_KEY in .env.local"}
            </span>
          </p>
          <p>
            X (Twitter):{" "}
            <span
              className="font-medium"
              style={{ color: xConfigured ? "var(--status-good)" : "var(--text-muted)" }}
            >
              {xConfigured
                ? "connected — approved posts publish live"
                : "not connected — approved posts stay simulated"}
            </span>
            {!xConfigured && (
              <span className="block text-[var(--text-muted)]">
                Set X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET in .env.local
                (OAuth 1.0a user-context credentials from the X Developer Portal, app
                permissions set to Read and Write).
              </span>
            )}
          </p>
          <p>
            Threads: <span className="font-medium text-[var(--text-muted)]">not built yet</span>
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
        <h2 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">Run agent cycle</h2>
        <p className="mb-4 text-xs text-[var(--text-muted)]">
          There&apos;s no live X mentions feed yet, so nothing polls automatically. Trigger a cycle
          manually and the Trend, Content, and Community agents will process whatever&apos;s new
          against the seeded mock data.
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
    </div>
  );
}
