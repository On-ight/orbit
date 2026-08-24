import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { ApprovalCard } from "@/components/approvals/ApprovalCard";
import { activeBufferPlatforms } from "@/lib/publishing/buffer-client";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { PLATFORMS, Platform } from "@/lib/types";

export const dynamic = "force-dynamic";

const TAB_LABELS: Record<Platform, string> = {
  X: "X",
  THREADS: "Threads",
  LINKEDIN: "LinkedIn",
};

function isPlatform(value: string | undefined): value is Platform {
  return !!value && (PLATFORMS as readonly string[]).includes(value);
}

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string }>;
}) {
  const currentUser = await requireCurrentUser();
  const { platform: platformParam } = await searchParams;
  const activeTab = isPlatform(platformParam) ? platformParam : undefined;

  const approvals = await prisma.approval.findMany({
    where: {
      accountId: currentUser.accountId,
      status: { in: ["PENDING", "EDITED"] },
      ...(activeTab ? { platform: activeTab } : {}),
    },
    include: { conversation: { select: { authorHandle: true, originalText: true } } },
    orderBy: { createdAt: "desc" },
  });

  const bufferPlatforms = await activeBufferPlatforms(currentUser.accountId);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Approval queue</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        {approvals.length} item{approvals.length === 1 ? "" : "s"} waiting on you.
      </p>

      <div className="mt-4 flex gap-1 border-b border-[var(--border)]">
        <Link
          href="/approvals"
          className={`px-3 py-2 text-sm font-medium ${
            !activeTab
              ? "border-b-2 border-[var(--accent)] text-[var(--text-primary)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          All
        </Link>
        {PLATFORMS.map((p) => (
          <Link
            key={p}
            href={`/approvals?platform=${p}`}
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === p
                ? "border-b-2 border-[var(--accent)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {TAB_LABELS[p]}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {approvals.length === 0 && (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 text-sm text-[var(--text-muted)]">
            Nothing pending{activeTab ? ` for ${TAB_LABELS[activeTab]}` : ""}. Run an agent cycle
            from Settings to generate new drafts.
          </p>
        )}
        {approvals.map((approval) => (
          <ApprovalCard
            key={approval.id}
            bufferPlatforms={bufferPlatforms}
            approval={{
              ...approval,
              createdAt: approval.createdAt.toISOString(),
            }}
          />
        ))}
      </div>
    </div>
  );
}
