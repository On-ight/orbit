import { requireCurrentUser } from "@/lib/auth/current-user";
import { isInstagramConnected } from "@/lib/publishing/instagram-client";
import { computePerformanceSummary } from "@/lib/agents/instagram-insights-agent";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

const MEDIA_LABEL: Record<string, string> = {
  REELS: "🎬 Reel",
  CAROUSEL_ALBUM: "🎠 Carousel",
};

// Platform-agnostic, always shown — independent of whether Instagram (or
// anything) is connected yet, so this page is never empty for a brand-new
// account. Kept deliberately general rather than duplicating anything
// already enforced elsewhere (character limits, hashtag caps, etc. are
// already handled by the product itself, not just advised here).
const GENERAL_TIPS = [
  "Consistency beats intensity — a steady daily cadence outperforms a burst of posts followed by silence, both for reach and for audience trust.",
  "Front-load the hook. Most platforms only show the first ~100-200 characters before \"see more\" — the first line has to earn the click on its own.",
  "Keep hashtags focused, not exhaustive. A handful of relevant tags reaches the right audience better than a long generic list.",
  "Reels and Carousels tend to reward different content: Reels suit a quick story or before/after moment, Carousels suit a step-by-step breakdown someone swipes through deliberately.",
  "Reply to real comments and mentions promptly — early engagement on a post is one of the strongest signals platforms use to decide who else sees it.",
  "Revisit what worked. A post that performed well usually isn't a one-off — the angle, format, or hook behind it is often worth repeating with a new topic.",
];

export default async function MarketingTipsPage() {
  const currentUser = await requireCurrentUser();
  const { accountId } = currentUser;

  const [connected, summary] = await Promise.all([
    isInstagramConnected(accountId),
    computePerformanceSummary(accountId),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Marketing tips</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        What&apos;s actually working on your Instagram posts, plus general advice that applies
        regardless of platform.
      </p>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Based on your performance</h2>
        {summary ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {summary.topPosts.map((post, i) => (
                <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
                  <p className="text-xs font-medium text-[var(--text-muted)]">{MEDIA_LABEL[post.mediaType] ?? post.mediaType}</p>
                  <p className="mt-1 text-sm text-[var(--text-primary)]">&quot;{post.title}&quot;</p>
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    {post.likes} likes · {post.comments} comments
                  </p>
                </div>
              ))}
            </div>
            {summary.reelsAvgEngagement !== null && summary.carouselsAvgEngagement !== null && (
              <p className="rounded-lg bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent)]">
                {summary.reelsAvgEngagement === summary.carouselsAvgEngagement
                  ? "Reels and Carousels are performing about the same recently."
                  : summary.reelsAvgEngagement > summary.carouselsAvgEngagement
                    ? `Reels are outperforming Carousels by about ${(summary.reelsAvgEngagement / Math.max(summary.carouselsAvgEngagement, 1)).toFixed(1)}x on average recently — lean toward Reels when the format choice is open.`
                    : `Carousels are outperforming Reels by about ${(summary.carouselsAvgEngagement / Math.max(summary.reelsAvgEngagement, 1)).toFixed(1)}x on average recently — lean toward Carousels when the format choice is open.`}
              </p>
            )}
            <p className="text-xs text-[var(--text-muted)]">
              This same summary is already feeding into future Reel/Carousel drafts automatically.
            </p>
          </div>
        ) : (
          <EmptyState
            mascot="wave"
            title={connected ? "Still gathering data" : "Connect Instagram to unlock this"}
            description={
              connected
                ? "Once a few Reels/Carousels have been published and had time to collect engagement, real performance tips will show up here."
                : "Connect Instagram in Settings — once you've published a few Reels or Carousels, this section fills in with real performance data."
            }
          />
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">General marketing tips</h2>
        <ul className="space-y-3">
          {GENERAL_TIPS.map((tip) => (
            <li key={tip} className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 text-sm text-[var(--text-secondary)]">
              {tip}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
