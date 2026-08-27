import { redirect } from "next/navigation";
import { Sidebar } from "@/components/nav/Sidebar";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await requireCurrentUser();

  // Every dashboard page needs an active subscription — /pricing lives
  // outside this layout group specifically so this redirect can't loop.
  if (currentUser.account.subscriptionStatus !== "active") {
    redirect("/pricing");
  }

  return (
    <div className="flex min-h-screen bg-[var(--page-plane)]">
      <Sidebar />
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-1)] px-6 py-3">
          <span className="text-sm font-medium text-[var(--text-primary)]">{currentUser.account.name}</span>
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: "var(--status-good-soft)", color: "var(--status-good)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-good)]" />
            AI active
          </span>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
