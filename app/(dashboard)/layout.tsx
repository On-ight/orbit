import { redirect } from "next/navigation";
import { Sidebar } from "@/components/nav/Sidebar";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

// Pulled out of the component body — Date.now() is an impure call, and
// eslint's react-hooks/purity rule flags it inline in a component/hook, even
// a server one that only ever renders once per request.
function trialDaysLeft(planTier: string | null, trialEndsAt: Date | null): number | null {
  if (planTier !== "FREE" || !trialEndsAt) return null;
  return Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await requireCurrentUser();

  // Onboarding sequence (knowledge base -> automation preference -> pricing)
  // only applies pre-subscription — an already-active account never gets
  // routed back into it, even if it later ends up with zero knowledge base
  // entries (the agent-cycle function's own guard handles that case instead, since
  // bouncing a paying customer entirely out of their dashboard over it
  // would be a much heavier consequence than the onboarding gate intends).
  if (currentUser.account.subscriptionStatus !== "active") {
    const kbCount = await prisma.knowledgeBaseEntry.count({ where: { accountId: currentUser.accountId } });
    if (kbCount === 0) redirect("/onboarding/knowledge-base");
    if (!currentUser.account.onboardingCompletedAt) redirect("/onboarding/automation");
    redirect("/pricing");
  }

  const daysLeft = trialDaysLeft(currentUser.account.planTier, currentUser.account.trialEndsAt);

  return (
    <div className="flex min-h-screen bg-[var(--page-plane)]">
      <Sidebar />
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-1)] px-6 py-3">
          <span className="text-sm font-medium text-[var(--text-primary)]">{currentUser.account.name}</span>
          <div className="flex items-center gap-3">
            {daysLeft !== null && (
              <a
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium hover:opacity-80"
                style={{ background: "var(--status-warning-soft)", color: "var(--status-warning)" }}
              >
                Free trial — {daysLeft === 0 ? "ends today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
              </a>
            )}
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: "var(--status-good-soft)", color: "var(--status-good)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-good)]" />
              AI active
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
