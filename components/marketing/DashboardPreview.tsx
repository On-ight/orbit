"use client";

import { useState } from "react";
import { ApprovalQueueDemo } from "@/components/marketing/ApprovalQueueDemo";

// Interactive recreation of the real dashboard (components/nav/Sidebar.tsx,
// app/(dashboard)/layout.tsx, and the Overview/Reels/Carousels pages) — not
// a screenshot or recording. Every button here actually does something
// (switches tabs, runs a fake generation flow, toggles local state), but
// all of it is self-contained client state with invented example content
// for a fictional account ("Flowbase") — nothing calls a real API or
// touches a real account.

type Tab = "overview" | "approvals" | "conversations" | "content" | "reels" | "carousels" | "settings";

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

const NAV_ITEMS: { tab: Tab; label: string; icon: () => React.JSX.Element }[] = [
  { tab: "overview", label: "Overview", icon: OverviewIcon },
  { tab: "approvals", label: "Approvals", icon: ApprovalsIcon },
  { tab: "conversations", label: "Conversations", icon: ConversationsIcon },
  { tab: "content", label: "Content", icon: ContentIcon },
  { tab: "reels", label: "Reels", icon: ReelsIcon },
  { tab: "carousels", label: "Carousels", icon: CarouselsIcon },
  { tab: "settings", label: "Settings", icon: SettingsIcon },
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

function OverviewTab({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  return (
    <div>
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
          <li className="text-sm text-[var(--text-secondary)]">2 posts ready to publish</li>
          <li className="text-sm text-[var(--text-secondary)]">1 Instagram Reel ready for approval</li>
          <li className="text-sm text-[var(--text-secondary)]">3 high-value conversations found</li>
        </ul>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => onNavigate("approvals")}
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition active:scale-95"
          >
            Go to approvals
          </button>
          <button
            onClick={() => onNavigate("conversations")}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition active:scale-95"
          >
            View conversations
          </button>
        </div>
      </div>
    </div>
  );
}

interface Conversation {
  id: string;
  handle: string;
  intent: "HIGH" | "MEDIUM";
  text: string;
  replied: boolean;
}

function ConversationsTab() {
  const [items, setItems] = useState<Conversation[]>([
    { id: "1", handle: "buildwithmara", intent: "HIGH", text: "How does Orbit decide what's safe to auto-post?", replied: false },
    { id: "2", handle: "nova_devlog", intent: "HIGH", text: "Does this work for a two-person team?", replied: false },
    { id: "3", handle: "kcarter", intent: "MEDIUM", text: "Been watching your build-in-public posts, love the consistency.", replied: true },
  ]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Conversations</h3>
      {items.map((c) => (
        <div key={c.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={
                c.intent === "HIGH"
                  ? { background: "var(--status-good-soft)", color: "var(--status-good)" }
                  : { background: "var(--status-warning-soft)", color: "var(--status-warning)" }
              }
            >
              {c.intent === "HIGH" ? "High intent" : "Medium intent"}
            </span>
            <span className="text-xs text-[var(--text-muted)]">@{c.handle}</span>
          </div>
          <p className="text-sm text-[var(--text-primary)]">&quot;{c.text}&quot;</p>
          <div className="mt-2">
            {c.replied ? (
              <span className="text-xs font-medium text-[var(--status-good)]">✓ Replied</span>
            ) : (
              <button
                onClick={() => setItems((prev) => prev.map((i) => (i.id === c.id ? { ...i, replied: true } : i)))}
                className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition active:scale-95"
              >
                Mark as replied
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ContentPost {
  id: string;
  platform: "X" | "THREADS" | "LINKEDIN" | "INSTAGRAM";
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  text: string;
}

const PLATFORM_FILTERS = ["ALL", "X", "THREADS", "LINKEDIN", "INSTAGRAM"] as const;

function ContentTab() {
  const [filter, setFilter] = useState<(typeof PLATFORM_FILTERS)[number]>("ALL");
  const posts: ContentPost[] = [
    { id: "1", platform: "X", status: "PUBLISHED", text: "Shipped a rebuilt onboarding flow this week — first result in under 2 minutes now." },
    { id: "2", platform: "THREADS", status: "SCHEDULED", text: "Here's what we learned rebuilding onboarding, a thread." },
    { id: "3", platform: "LINKEDIN", status: "DRAFT", text: "We redesigned our onboarding flow this quarter — full breakdown." },
    { id: "4", platform: "INSTAGRAM", status: "DRAFT", text: "Carousel: \"Why most onboarding flows lose users.\"" },
  ];
  const visible = filter === "ALL" ? posts : posts.filter((p) => p.platform === filter);
  const STATUS_COLOR: Record<ContentPost["status"], string> = {
    DRAFT: "var(--text-muted)",
    SCHEDULED: "var(--status-warning)",
    PUBLISHED: "var(--status-good)",
  };

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Content</h3>
      <div className="mb-4 flex flex-wrap gap-2">
        {PLATFORM_FILTERS.map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium transition"
            style={
              filter === p
                ? { borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--accent)" }
                : { borderColor: "var(--border)", color: "var(--text-secondary)" }
            }
          >
            {p === "ALL" ? "All" : p}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {visible.map((post) => (
          <div key={post.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-muted)]">{post.platform}</span>
              <span className="text-xs font-medium" style={{ color: STATUS_COLOR[post.status] }}>
                {post.status}
              </span>
            </div>
            <p className="text-sm text-[var(--text-primary)]">{post.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

type GeneratePhase = "idle" | "generating" | "choosing" | "rendering" | "ready" | "approved" | "rejected";

interface Version {
  angle: string;
  title: string;
  hook: string;
}

function GenerateFlow({
  kind,
  opportunity,
  versions,
  readyLabel,
}: {
  kind: "reel" | "carousel";
  opportunity: string;
  versions: Version[];
  readyLabel: string;
}) {
  const [phase, setPhase] = useState<GeneratePhase>("idle");
  const [chosen, setChosen] = useState<Version | null>(null);

  function reset() {
    setPhase("idle");
    setChosen(null);
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {kind === "reel" ? "Reel opportunity" : "Carousel opportunity"}
      </p>
      <p className="mt-1 text-sm text-[var(--text-primary)]">{opportunity}</p>

      {phase === "idle" && (
        <button
          onClick={() => {
            setPhase("generating");
            setTimeout(() => setPhase("choosing"), 1100);
          }}
          className="mt-4 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition active:scale-95"
        >
          {kind === "reel" ? "Generate Reel →" : "Generate Carousel →"}
        </button>
      )}

      {phase === "generating" && <p className="mt-4 text-sm text-[var(--text-muted)]">Writing script options…</p>}

      {phase === "choosing" && (
        <div className="mt-4 space-y-2">
          {versions.map((v) => (
            <button
              key={v.angle}
              onClick={() => {
                setChosen(v);
                setPhase("rendering");
                setTimeout(() => setPhase("ready"), 1300);
              }}
              className="block w-full rounded-lg border border-[var(--border)] p-3 text-left transition hover:border-[var(--accent)]"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{v.angle}</p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{v.title}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">&quot;{v.hook}&quot;</p>
            </button>
          ))}
        </div>
      )}

      {phase === "rendering" && (
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          ✦ {kind === "reel" ? "Your AI influencer is filming this Reel…" : "Laying out your carousel slides…"}
        </p>
      )}

      {phase === "ready" && chosen && (
        <div className="mt-4 rounded-lg border border-[var(--border)] p-3">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-base text-white"
              style={{ background: "linear-gradient(135deg, #6229CE, #8E42FC 55%, #BC69EB)" }}
            >
              {kind === "reel" ? "▶" : "▦"}
            </span>
            <p className="text-sm text-[var(--text-primary)]">&quot;{chosen.title}&quot;</p>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setPhase("approved")}
              className="rounded-md bg-[var(--status-good)] px-3 py-1.5 text-xs font-medium text-white transition active:scale-95"
            >
              ✓ Approve
            </button>
            <button
              onClick={() => setPhase("rejected")}
              className="rounded-md border border-[var(--status-critical)] px-3 py-1.5 text-xs font-medium text-[var(--status-critical)] transition active:scale-95"
            >
              ✕ Reject
            </button>
          </div>
        </div>
      )}

      {phase === "approved" && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--status-good)]">✓ {readyLabel}</p>
          <button onClick={reset} className="text-xs text-[var(--text-muted)] hover:underline">
            Try again
          </button>
        </div>
      )}

      {phase === "rejected" && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--status-critical)]">Rejected — removed from queue</p>
          <button onClick={reset} className="text-xs text-[var(--text-muted)] hover:underline">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

function ReelsTab() {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Reels</h3>
      <GenerateFlow
        kind="reel"
        opportunity="Trend found: “AI agents are quietly eating SaaS onboarding.”"
        readyLabel="Publishing to Instagram"
        versions={[
          { angle: "Lesson", title: "3 lessons from rebuilding onboarding", hook: "We cut onboarding from 15 minutes to under 2." },
          { angle: "Behind the scenes", title: "What our onboarding rebuild actually looked like", hook: "No roadmap, just a lot of user recordings." },
          { angle: "Bold take", title: "Your onboarding flow is probably too long", hook: "Here's how we knew ours was." },
        ]}
      />
    </div>
  );
}

function CarouselsTab() {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Carousels</h3>
      <GenerateFlow
        kind="carousel"
        opportunity="Trend found: “Why most onboarding flows lose users in the first 2 minutes.”"
        readyLabel="Publishing to Instagram"
        versions={[
          { angle: "Listicle", title: "5 reasons onboarding flows lose users", hook: "Slide 1: too many steps before any value." },
          { angle: "Case study", title: "How we cut our own drop-off in half", hook: "Slide 1: the old flow, step by step." },
          { angle: "Myth-bust", title: "“More setup = more retention” is wrong", hook: "Slide 1: here's the data." },
        ]}
      />
    </div>
  );
}

interface Connection {
  name: string;
  connected: boolean;
}

function SettingsTab() {
  const [connections, setConnections] = useState<Connection[]>([
    { name: "X", connected: true },
    { name: "Threads", connected: true },
    { name: "LinkedIn", connected: false },
    { name: "Instagram", connected: true },
  ]);

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Connected accounts</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {connections.map((c) => (
          <div key={c.name} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{c.name}</p>
              <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: c.connected ? "var(--status-good)" : "var(--text-muted)" }}
                />
                {c.connected ? "Connected" : "Not connected"}
              </p>
            </div>
            <button
              onClick={() =>
                setConnections((prev) =>
                  prev.map((p) => (p.name === c.name ? { ...p, connected: !p.connected } : p)),
                )
              }
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition active:scale-95"
            >
              {c.connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardPreview() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] shadow-[0_40px_90px_-30px_rgba(142,66,252,0.3),0_15px_35px_-10px_rgba(0,0,0,0.15)]">
      {/* Browser-chrome strip, purely decorative. */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-1)] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 rounded-md bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--text-muted)]">
          app.orbitai.co.in/dashboard
        </span>
      </div>

      <div className="flex h-[36rem]">
        <aside className="hidden w-52 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-1)] sm:flex">
          <div className="px-5 py-5">
            <p className="text-base font-semibold" style={{ color: "var(--accent)" }}>
              Orbit
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Growth Command Center</p>
          </div>
          <nav className="flex-1 space-y-0.5 px-3">
            {NAV_ITEMS.map(({ tab: itemTab, label, icon: Icon }) => {
              const active = tab === itemTab;
              return (
                <button
                  key={itemTab}
                  onClick={() => setTab(itemTab)}
                  className="flex w-full items-center gap-2.5 rounded-lg border-l-[3px] px-3 py-2 text-left text-sm transition"
                  style={
                    active
                      ? { borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 600 }
                      : { borderColor: "transparent", color: "var(--text-secondary)" }
                  }
                >
                  <Icon />
                  {label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 overflow-y-auto bg-[var(--page-plane)]">
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
            {tab === "overview" && <OverviewTab onNavigate={setTab} />}
            {tab === "approvals" && <ApprovalQueueDemo variant="flat" />}
            {tab === "conversations" && <ConversationsTab />}
            {tab === "content" && <ContentTab />}
            {tab === "reels" && <ReelsTab />}
            {tab === "carousels" && <CarouselsTab />}
            {tab === "settings" && <SettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
