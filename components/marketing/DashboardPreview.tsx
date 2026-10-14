// Static recreation of the real dashboard (components/nav/Sidebar.tsx +
// app/(dashboard)/dashboard/page.tsx), not a screenshot or recording —
// built from the same nav items, copy, and CSS tokens as the real thing so
// it stays accurate if either changes, but every number here is invented
// example data for a fictional account, never pulled from a real one.
function OverviewIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8.5" y="1.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1.5" y="8.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8.5" y="8.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function ApprovalsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5L6.2 11.5L13 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ConversationsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 3.5h12v7H6.5L3 13.5v-3H2v-7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function ContentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 1.5h5.5L12.5 4.5V14.5h-8.5v-13Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6 8h4M6 10.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ReelsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 5.5L10.5 8L6.5 10.5V5.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function CarouselsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="8" height="10" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
      <rect x="7.5" y="5" width="7.5" height="8" rx="1.3" stroke="currentColor" strokeWidth="1.4" fill="var(--surface-1)" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 1.8v1.4M8 12.8v1.4M14.2 8h-1.4M3.2 8H1.8M12.3 3.7l-1 1M4.7 11.3l-1 1M12.3 12.3l-1-1M4.7 4.7l-1-1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

const NAV_ITEMS = [
  { label: "Overview", icon: OverviewIcon, active: true },
  { label: "Approvals", icon: ApprovalsIcon, active: false },
  { label: "Conversations", icon: ConversationsIcon, active: false },
  { label: "Content", icon: ContentIcon, active: false },
  { label: "Reels", icon: ReelsIcon, active: false },
  { label: "Carousels", icon: CarouselsIcon, active: false },
  { label: "Settings", icon: SettingsIcon, active: false },
];

function StatTile({ label, value, demo }: { label: string; value: string; demo?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-5 py-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        {demo && (
          <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Demo
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

const ATTENTION_ITEMS = [
  "2 posts ready to publish",
  "1 Instagram Reel ready for approval",
  "3 high-value conversations found",
];

export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] shadow-[0_40px_90px_-30px_rgba(142,66,252,0.3),0_15px_35px_-10px_rgba(0,0,0,0.15)]">
      {/* Browser-chrome strip, purely decorative — makes clear this is a
          recreation of a real web app view, not a bare component. */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-1)] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 rounded-md bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--text-muted)]">
          app.orbitai.co.in/dashboard
        </span>
      </div>

      <div className="flex h-[32rem]">
        {/* Sidebar — mirrors components/nav/Sidebar.tsx */}
        <aside className="hidden w-52 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-1)] sm:flex">
          <div className="px-5 py-5">
            <p className="text-base font-semibold" style={{ color: "var(--accent)" }}>
              Orbit
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Growth Command Center</p>
          </div>
          <nav className="flex-1 space-y-0.5 px-3">
            {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-lg border-l-[3px] px-3 py-2 text-sm"
                style={
                  active
                    ? { borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 600 }
                    : { borderColor: "transparent", color: "var(--text-secondary)" }
                }
              >
                <Icon />
                {label}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main pane — mirrors app/(dashboard)/layout.tsx's header + the
            Overview page's content. */}
        <div className="flex-1 overflow-hidden bg-[var(--page-plane)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-1)] px-6 py-3">
            <span className="text-sm font-medium text-[var(--text-primary)]">Flowbase</span>
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: "var(--status-good-soft)", color: "var(--status-good)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-good)]" />
              AI active
            </span>
          </div>

          <div className="px-6 py-6">
            <p className="text-sm text-[var(--text-muted)]">Good morning.</p>
            <h3 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
              Here&apos;s what happened while you were away.
            </h3>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Pending approvals" value="6" />
              <StatTile label="Mentions processed" value="214" />
              <StatTile label="New followers" value="1.2K" demo />
              <StatTile label="Waitlist signups" value="38" demo />
            </div>

            <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                🔥 Needs your attention
              </h4>
              <ul className="space-y-2">
                {ATTENTION_ITEMS.map((item) => (
                  <li key={item} className="text-sm text-[var(--text-secondary)]">
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex gap-3">
                <span className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white">
                  Go to approvals
                </span>
                <span className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
                  View conversations
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
