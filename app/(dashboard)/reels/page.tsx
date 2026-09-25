import { prisma } from "@/lib/db/prisma";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { ReelOpportunityCard } from "@/components/reels/ReelOpportunityCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { limitsForTier } from "@/lib/billing/plan-limits";
import { countReelsThisMonth } from "@/lib/billing/usage";
import { REEL_MODE_LABELS, type ReelMode } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  SCRIPT_OPTIONS: "Choosing a version",
  RENDERING: "Rendering…",
  READY: "Ready for approval",
  FAILED: "Failed",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STATUS_COLOR: Record<string, string> = {
  SCRIPT_OPTIONS: "var(--text-muted)",
  RENDERING: "var(--status-warning)",
  READY: "var(--status-good)",
  FAILED: "var(--status-critical)",
  APPROVED: "var(--status-good)",
  REJECTED: "var(--text-muted)",
};

export default async function ReelsPage() {
  const currentUser = await requireCurrentUser();
  const { accountId } = currentUser;

  const [opportunities, reels, reelsUsed] = await Promise.all([
    // A Reel opportunity is any AUTO-tier, already-summarized trend that
    // hasn't been turned into a Reel yet — no separate detection agent, just
    // a query against data the Trend Agent already produced.
    prisma.trendInput.findMany({
      where: { accountId, riskTier: "AUTO", summary: { not: null }, reels: { none: {} } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.reel.findMany({ where: { accountId }, orderBy: { createdAt: "desc" }, take: 20 }),
    countReelsThisMonth(accountId),
  ]);

  const limits = limitsForTier(currentUser.account.planTier);
  const quotaReached = reelsUsed >= limits.reelsPerMonth;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Reels</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        {limits.reelsPerMonth === 0
          ? "AI Reels aren't included on your current plan — upgrade from Settings to unlock them."
          : `${reelsUsed} of ${limits.reelsPerMonth} Reels used this month.`}
      </p>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Opportunities</h2>
        {opportunities.length === 0 ? (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 text-sm text-[var(--text-muted)]">
            No Reel opportunities yet — these show up once the Trend Agent finds something worth
            turning into a video.
          </p>
        ) : (
          <div className="space-y-4">
            {opportunities.map((trend) => (
              <ErrorBoundary key={trend.id} label="this Reel opportunity">
                <ReelOpportunityCard
                  trend={{ id: trend.id, topic: trend.topic, summary: trend.summary ?? "" }}
                  disabled={quotaReached}
                />
              </ErrorBoundary>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Your Reels</h2>
        {reels.length === 0 ? (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 text-sm text-[var(--text-muted)]">
            No Reels yet.
          </p>
        ) : (
          <div className="space-y-3">
            {reels.map((reel) => (
              <div key={reel.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {reel.title ?? "Untitled Reel"}
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: STATUS_COLOR[reel.status] ?? "var(--text-muted)" }}
                  >
                    {STATUS_LABEL[reel.status] ?? reel.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {REEL_MODE_LABELS[reel.mode as ReelMode] ?? reel.mode}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
