import { prisma } from "@/lib/db/prisma";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { CarouselOpportunityCard } from "@/components/carousels/CarouselOpportunityCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { limitsForTier } from "@/lib/billing/plan-limits";
import { countCarouselsThisMonth } from "@/lib/billing/usage";
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

export default async function CarouselsPage() {
  const currentUser = await requireCurrentUser();
  const { accountId } = currentUser;

  const [opportunities, carousels, carouselsUsed] = await Promise.all([
    // Same shared trend pool Reels draws opportunities from, deduped
    // independently — a trend already turned into a Reel can still become a
    // Carousel, and vice versa.
    prisma.trendInput.findMany({
      where: { accountId, riskTier: "AUTO", summary: { not: null }, carousels: { none: {} } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.carousel.findMany({ where: { accountId }, orderBy: { createdAt: "desc" }, take: 20 }),
    countCarouselsThisMonth(accountId),
  ]);

  const limits = limitsForTier(currentUser.account.planTier);
  const quotaReached = carouselsUsed >= limits.carouselsPerMonth;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Carousels</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        {`${carouselsUsed} of ${limits.carouselsPerMonth} Carousels used this month.`}
      </p>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Opportunities</h2>
        {opportunities.length === 0 ? (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 text-sm text-[var(--text-muted)]">
            No Carousel opportunities yet — these show up once the Trend Agent finds something
            worth turning into a slide post.
          </p>
        ) : (
          <div className="space-y-4">
            {opportunities.map((trend) => (
              <ErrorBoundary key={trend.id} label="this Carousel opportunity">
                <CarouselOpportunityCard
                  trend={{ id: trend.id, topic: trend.topic, summary: trend.summary ?? "" }}
                  disabled={quotaReached}
                />
              </ErrorBoundary>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Your Carousels</h2>
        {carousels.length === 0 ? (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 text-sm text-[var(--text-muted)]">
            No Carousels yet.
          </p>
        ) : (
          <div className="space-y-3">
            {carousels.map((carousel) => (
              <div key={carousel.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {carousel.title ?? "Untitled Carousel"}
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: STATUS_COLOR[carousel.status] ?? "var(--text-muted)" }}
                  >
                    {STATUS_LABEL[carousel.status] ?? carousel.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {REEL_MODE_LABELS[carousel.mode as ReelMode] ?? carousel.mode}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
