import { prisma } from "@/lib/db/prisma";
import { ApprovalCard } from "@/components/approvals/ApprovalCard";
import { isXConfigured } from "@/lib/publishing/x-client";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const approvals = await prisma.approval.findMany({
    where: { status: { in: ["PENDING", "EDITED"] } },
    include: { conversation: { select: { authorHandle: true, originalText: true } } },
    orderBy: { createdAt: "desc" },
  });
  const xConfigured = isXConfigured();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Approval queue</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        {approvals.length} item{approvals.length === 1 ? "" : "s"} waiting on you.
      </p>

      <div className="mt-6 space-y-4">
        {approvals.length === 0 && (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 text-sm text-[var(--text-muted)]">
            Nothing pending. Run an agent cycle from Settings to generate new drafts.
          </p>
        )}
        {approvals.map((approval) => (
          <ApprovalCard
            key={approval.id}
            xConfigured={xConfigured}
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
