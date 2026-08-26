import { prisma } from "@/lib/db/prisma";
import { RunCycleButton } from "@/components/settings/RunCycleButton";
import { KnowledgeBaseManager } from "@/components/settings/KnowledgeBaseManager";
import { ConnectionsPanel } from "@/components/settings/ConnectionsPanel";
import { isBufferConfiguredForPlatform } from "@/lib/publishing/buffer-client";
import { requireCurrentUser } from "@/lib/auth/current-user";
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

function xErrorMessage(code: string): string {
  if (code === "not_configured") return "X isn't configured yet — contact support.";
  if (code === "missing_params" || code === "expired") return "That connection link expired — try again.";
  if (code === "token_mismatch") return "Something didn't match up — try connecting again.";
  return "Couldn't connect X — try again, or contact support if it keeps happening.";
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const currentUser = await requireCurrentUser();
  const { accountId } = currentUser;
  const params = await searchParams;

  const [runs, hasApiKey, platformConnections, knowledgeBaseEntries, xToken] = await Promise.all([
    prisma.agentRun.findMany({ where: { accountId }, orderBy: { startedAt: "desc" }, take: 10 }),
    Promise.resolve(Boolean(process.env.ANTHROPIC_API_KEY)),
    Promise.all(PLATFORMS.map(async (p) => [p, await isBufferConfiguredForPlatform(accountId, p)] as const)),
    prisma.knowledgeBaseEntry.findMany({ where: { accountId }, orderBy: { createdAt: "asc" } }),
    prisma.accountSocialToken.findUnique({ where: { accountId_platform: { accountId, platform: "X" } } }),
  ]);

  const connectedByPlatform = Object.fromEntries(platformConnections);

  let notice: { kind: "success" | "error"; message: string } | null = null;
  if (params.x_connected) {
    notice = { kind: "success", message: `Connected as @${xToken?.externalUsername ?? "your account"}.` };
  } else if (params.x_disconnected) {
    notice = { kind: "success", message: "X disconnected." };
  } else if (typeof params.x_error === "string") {
    notice = { kind: "error", message: xErrorMessage(params.x_error) };
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Settings</h1>

      <div className="mt-6">
        <ConnectionsPanel
          x={{ connected: Boolean(xToken), username: xToken?.externalUsername }}
          threads={{ connected: connectedByPlatform.THREADS }}
          linkedin={{ connected: connectedByPlatform.LINKEDIN }}
          notice={notice}
        />
      </div>

      <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
        <p className="text-xs">
          Claude API key:{" "}
          <span
            className="font-medium"
            style={{ color: hasApiKey ? "var(--status-good)" : "var(--status-critical)" }}
          >
            {hasApiKey ? "configured" : "missing — contact support"}
          </span>
        </p>
        {(!connectedByPlatform.THREADS || !connectedByPlatform.LINKEDIN) && (
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Threads/LinkedIn via Buffer are set up by hand shortly after you connect there — reach
            out if it&apos;s been more than a day or two.
          </p>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
        <h2 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">Run agent cycle</h2>
        <p className="mb-4 text-xs text-[var(--text-muted)]">
          Runs automatically every morning at 6am IST via a scheduled job (look for{" "}
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
