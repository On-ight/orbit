"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AGENT_CYCLE_TIME_SLOTS, type AgentCycleTimeSlot } from "@/lib/types";

const SLOT_LABELS: Record<AgentCycleTimeSlot, string> = {
  "00:00": "12:00 AM IST",
  "06:00": "6:00 AM IST",
  "12:00": "12:00 PM IST",
  "18:00": "6:00 PM IST",
};

export function AutomationSettings({
  autoApproveMode: initialAutoApproveMode,
  agentCycleTimeSlot: initialTimeSlot,
  cycleMode: initialCycleMode,
}: {
  autoApproveMode: boolean;
  agentCycleTimeSlot: string;
  cycleMode: string;
}) {
  const router = useRouter();

  // What's actually saved on the server — the "Run agent cycle" section
  // below this component lives in the parent (server-rendered) page, so
  // clicking these buttons must not apply anything until Save; otherwise
  // there'd be no single moment to router.refresh() that section into
  // sync, which is exactly the bug this replaces (toggling stuck the
  // dashboard's Manual/Automatic sections out of sync with the real value).
  const [saved, setSaved] = useState({
    autoApproveMode: initialAutoApproveMode,
    timeSlot: initialTimeSlot,
    cycleMode: initialCycleMode,
  });

  // What's currently selected in the UI, not yet saved.
  const [autoApproveMode, setAutoApproveMode] = useState(initialAutoApproveMode);
  const [timeSlot, setTimeSlot] = useState(initialTimeSlot);
  const [cycleMode, setCycleMode] = useState(initialCycleMode);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty =
    autoApproveMode !== saved.autoApproveMode ||
    timeSlot !== saved.timeSlot ||
    cycleMode !== saved.cycleMode;

  function handleDiscard() {
    setAutoApproveMode(saved.autoApproveMode);
    setTimeSlot(saved.timeSlot);
    setCycleMode(saved.cycleMode);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/account/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoApproveMode, agentCycleTimeSlot: timeSlot, cycleMode }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to save");
      setSaved({ autoApproveMode, timeSlot, cycleMode });
      // The "Run agent cycle" vs. time-slot section is rendered by the
      // parent server component from the account's saved cycleMode — this
      // is what actually makes it flip immediately instead of staying
      // stale until the next unrelated navigation.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-2">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">How the cycle runs</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Manual means only the &quot;Run agent cycle&quot; button (below) triggers a cycle.
          Automatic runs it daily on its own, at a time you choose.
        </p>
        <div className="mt-3 flex overflow-hidden rounded-lg border border-[var(--border)] text-sm font-medium">
          <button
            type="button"
            onClick={() => setCycleMode("MANUAL")}
            className="flex-1 px-4 py-2 transition"
            style={
              cycleMode === "MANUAL"
                ? { background: "var(--accent)", color: "#fff" }
                : { background: "var(--surface-1)", color: "var(--text-secondary)" }
            }
          >
            Manual
          </button>
          <button
            type="button"
            onClick={() => setCycleMode("AUTOMATIC")}
            className="flex-1 px-4 py-2 transition"
            style={
              cycleMode === "AUTOMATIC"
                ? { background: "var(--accent)", color: "#fff" }
                : { background: "var(--surface-1)", color: "var(--text-secondary)" }
            }
          >
            Automatic
          </button>
        </div>

        {cycleMode === "AUTOMATIC" && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AGENT_CYCLE_TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setTimeSlot(slot)}
                className="rounded-lg border px-3 py-2 text-sm font-medium transition"
                style={
                  timeSlot === slot
                    ? { background: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--accent)" }
                    : { background: "var(--surface-1)", borderColor: "var(--border)", color: "var(--text-secondary)" }
                }
              >
                {SLOT_LABELS[slot as AgentCycleTimeSlot]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Approval mode</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Applies only to 🟢 Auto-tier replies. 🔴 Never-tier items always require a human, no
          matter what — that never changes.
        </p>
        <div className="mt-3 flex overflow-hidden rounded-lg border border-[var(--border)] text-sm font-medium">
          <button
            type="button"
            onClick={() => setAutoApproveMode(false)}
            className="flex-1 px-4 py-2 transition"
            style={
              !autoApproveMode
                ? { background: "var(--accent)", color: "#fff" }
                : { background: "var(--surface-1)", color: "var(--text-secondary)" }
            }
          >
            Manual — I review everything
          </button>
          <button
            type="button"
            onClick={() => setAutoApproveMode(true)}
            className="flex-1 px-4 py-2 transition"
            style={
              autoApproveMode
                ? { background: "var(--accent)", color: "#fff" }
                : { background: "var(--surface-1)", color: "var(--text-secondary)" }
            }
          >
            Auto-approve 🟢 Auto items
          </button>
        </div>
      </div>

      {isDirty && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-6"
          role="dialog"
          aria-label="Unsaved automation changes"
        >
          <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-5 py-3 shadow-lg">
            <p className="text-sm text-[var(--text-secondary)]">You have unsaved changes</p>
            {error && <p className="text-sm text-[var(--status-critical)]">{error}</p>}
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saving}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] transition hover:text-[var(--text-primary)] disabled:cursor-not-allowed"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-md px-4 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
