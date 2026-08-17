import { Sidebar } from "@/components/nav/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <header className="flex items-center justify-end border-b border-[var(--border)] bg-[var(--surface-1)] px-6 py-3">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-[var(--status-good)]">
            <span className="h-2 w-2 rounded-full bg-[var(--status-good)]" />
            AI ACTIVE
          </span>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
