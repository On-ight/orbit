import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { StatTile } from "@/components/dashboard/StatTile";

export const dynamic = "force-dynamic";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function OverviewPage() {
  const [pendingApprovals, pendingReplies, pendingPosts, highIntentCount, flaggedCount, mentionsProcessed, latestSnapshot] =
    await Promise.all([
      prisma.approval.count({ where: { status: "PENDING" } }),
      prisma.approval.count({ where: { status: "PENDING", type: "REPLY" } }),
      prisma.approval.count({ where: { status: "PENDING", type: "POST" } }),
      prisma.conversation.count({ where: { intent: "HIGH", status: { in: ["NEW", "DRAFTED"] } } }),
      prisma.conversation.count({ where: { riskTier: "NEVER", status: "NEW" } }),
      prisma.conversation.count(),
      prisma.dailySnapshot.findFirst({ orderBy: { date: "desc" } }),
    ]);

  const attentionItems = [
    pendingReplies > 0 && `${pendingReplies} ${pendingReplies === 1 ? "reply" : "replies"} waiting for approval`,
    pendingPosts > 0 && `${pendingPosts} ${pendingPosts === 1 ? "post" : "posts"} ready to publish`,
    highIntentCount > 0 && `${highIntentCount} high-value ${highIntentCount === 1 ? "conversation" : "conversations"} found`,
    flaggedCount > 0 && `${flaggedCount} flagged ${flaggedCount === 1 ? "item needs" : "items need"} manual review`,
  ].filter(Boolean) as string[];

  return (
    <div>
      <p className="text-sm text-[var(--text-muted)]">{greeting()}.</p>
      <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
        Here&apos;s what happened while you were away.
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Pending approvals" value={pendingApprovals} />
        <StatTile label="Mentions processed" value={mentionsProcessed} />
        <StatTile label="New followers" value={latestSnapshot?.newFollowers ?? 0} isDemoData />
        <StatTile label="Waitlist signups" value={latestSnapshot?.waitlistSignups ?? 0} isDemoData />
      </div>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          🔥 Needs your attention
        </h2>

        {attentionItems.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Nothing needs you right now. Run an agent cycle in Settings to look for new work.
          </p>
        ) : (
          <ul className="space-y-2">
            {attentionItems.map((item) => (
              <li key={item} className="text-sm text-[var(--text-secondary)]">
                {item}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex gap-3">
          <Link
            href="/approvals"
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
          >
            Go to approvals
          </Link>
          <Link
            href="/conversations"
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            View conversations
          </Link>
        </div>
      </div>
    </div>
  );
}
