"use client";

import { useState } from "react";

interface DemoItem {
  id: string;
  tier: "auto" | "approval" | "never";
  tierLabel: string;
  meta: string;
  text: string;
  confirmText: string;
}

const ITEMS: DemoItem[] = [
  {
    id: "1",
    tier: "auto",
    tierLabel: "🟢 Auto",
    meta: "Product update → X",
    text: "We just shipped a rebuilt onboarding flow — new users see their first result in under 2 minutes now.",
    confirmText: "✓ Scheduled for X",
  },
  {
    id: "2",
    tier: "approval",
    tierLabel: "🟡 Needs approval",
    meta: "Reply to @customer",
    text: "How much does Orbit cost?",
    confirmText: "✓ Reply sent to @customer",
  },
  {
    id: "3",
    tier: "never",
    tierLabel: "🔴 Human only",
    meta: "Negative sentiment detected",
    text: "Flagged for you — Orbit won't draft a reply to this one.",
    confirmText: "",
  },
];

const TIER_BADGE: Record<DemoItem["tier"], string> = {
  auto: "bg-[var(--status-good-soft)] text-[var(--status-good)]",
  approval: "bg-[var(--status-warning-soft)] text-[var(--status-warning)]",
  never: "bg-[var(--status-critical-soft)] text-[var(--status-critical)]",
};

type ItemState = "pending" | "approved" | "rejected";

export function ApprovalQueueDemo() {
  const [states, setStates] = useState<Record<string, ItemState>>({});

  return (
    <div className="[perspective:1600px]">
      <div
        className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-[0_30px_70px_-20px_rgba(142,66,252,0.35),0_12px_28px_-8px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out [transform:rotateY(-8deg)_rotateX(3deg)] hover:[transform:rotateY(-3deg)_rotateX(1deg)]"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          Orbit&apos;s approval queue — try it
        </p>

        {ITEMS.map((item) => {
          const state = states[item.id] ?? "pending";
          return (
            <div
              key={item.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TIER_BADGE[item.tier]}`}>
                  {item.tierLabel}
                </span>
                <span className="text-xs text-[var(--text-muted)]">{item.meta}</span>
              </div>
              <p className="text-sm text-[var(--text-primary)]">&quot;{item.text}&quot;</p>

              {item.tier !== "never" && state === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setStates((s) => ({ ...s, [item.id]: "approved" }))}
                    className="rounded-md bg-[var(--status-good)] px-3 py-1.5 text-xs font-medium text-white transition active:scale-95"
                  >
                    ✓ Approve
                  </button>
                  <button className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition active:scale-95">
                    Edit
                  </button>
                  <button
                    onClick={() => setStates((s) => ({ ...s, [item.id]: "rejected" }))}
                    className="rounded-md border border-[var(--status-critical)] px-3 py-1.5 text-xs font-medium text-[var(--status-critical)] transition active:scale-95"
                  >
                    ✕ Reject
                  </button>
                </div>
              )}

              {item.tier !== "never" && state === "approved" && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs font-medium text-[var(--status-good)]">{item.confirmText}</p>
                  <button
                    onClick={() => setStates((s) => ({ ...s, [item.id]: "pending" }))}
                    className="text-xs text-[var(--text-muted)] hover:underline"
                  >
                    Undo
                  </button>
                </div>
              )}

              {item.tier !== "never" && state === "rejected" && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs font-medium text-[var(--status-critical)]">Rejected — removed from queue</p>
                  <button
                    onClick={() => setStates((s) => ({ ...s, [item.id]: "pending" }))}
                    className="text-xs text-[var(--text-muted)] hover:underline"
                  >
                    Undo
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
