"use client";

import { useState } from "react";
import { AGENT_CYCLE_TIME_SLOTS, type AgentCycleTimeSlot } from "@/lib/types";

const SLOT_LABELS: Record<AgentCycleTimeSlot, string> = {
  "00:00": "12:00 AM IST",
  "06:00": "6:00 AM IST",
  "12:00": "12:00 PM IST",
  "18:00": "6:00 PM IST",
};

async function patchSettings(body: Record<string, unknown>) {
  const res = await fetch("/api/account/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to save");
}

export function AutomationSettings({
  autoApproveMode: initialAutoApproveMode,
  agentCycleTimeSlot: initialTimeSlot,
}: {
  autoApproveMode: boolean;
  agentCycleTimeSlot: string;
}) {
  const [autoApproveMode, setAutoApproveMode] = useState(initialAutoApproveMode);
  const [timeSlot, setTimeSlot] = useState(initialTimeSlot);
  const [saving, setSaving] = useState<"mode" | "slot" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(next: boolean) {
    const previous = autoApproveMode;
    setAutoApproveMode(next);
    setSaving("mode");
    setError(null);
    try {
      await patchSettings({ autoApproveMode: next });
    } catch (err) {
      setAutoApproveMode(previous);
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(null);
    }
  }

  async function handleSlotChange(next: string) {
    const previous = timeSlot;
    setTimeSlot(next);
    setSaving("slot");
    setError(null);
    try {
      await patchSettings({ agentCycleTimeSlot: next });
    } catch (err) {
      setTimeSlot(previous);
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Approval mode</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Applies only to 🟢 Auto-tier replies. 🔴 Never-tier items always require a human, no
          matter what — that never changes.
        </p>
        <div className="mt-3 flex overflow-hidden rounded-lg border border-[var(--border)] text-sm font-medium">
          <button
            type="button"
            onClick={() => handleToggle(false)}
            disabled={saving === "mode"}
            className="flex-1 px-4 py-2 transition disabled:cursor-not-allowed"
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
            onClick={() => handleToggle(true)}
            disabled={saving === "mode"}
            className="flex-1 px-4 py-2 transition disabled:cursor-not-allowed"
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

      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Daily run time</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          When the agent cycle researches, drafts, and (if auto-approve is on) publishes each day.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {AGENT_CYCLE_TIME_SLOTS.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => handleSlotChange(slot)}
              disabled={saving === "slot"}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed"
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
      </div>

      {error && <p className="text-xs text-[var(--status-critical)]">{error}</p>}
    </div>
  );
}
