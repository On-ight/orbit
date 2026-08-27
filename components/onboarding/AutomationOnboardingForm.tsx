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

export function AutomationOnboardingForm() {
  const router = useRouter();
  const [cycleMode, setCycleMode] = useState<"MANUAL" | "AUTOMATIC">("MANUAL");
  const [timeSlot, setTimeSlot] = useState<string>("06:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          cycleMode === "AUTOMATIC" ? { cycleMode, agentCycleTimeSlot: timeSlot } : { cycleMode },
        ),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to save");
      router.push("/pricing");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-neutral-800">
          How should Orbit AI run each day?
        </p>
        <div className="flex overflow-hidden rounded-lg border border-neutral-300 text-sm font-medium">
          <button
            type="button"
            onClick={() => setCycleMode("MANUAL")}
            className="flex-1 px-4 py-3 transition"
            style={
              cycleMode === "MANUAL"
                ? { background: "#8E42FC", color: "#fff" }
                : { background: "#fff", color: "#525252" }
            }
          >
            Manual — I'll click "Run" myself
          </button>
          <button
            type="button"
            onClick={() => setCycleMode("AUTOMATIC")}
            className="flex-1 px-4 py-3 transition"
            style={
              cycleMode === "AUTOMATIC"
                ? { background: "#8E42FC", color: "#fff" }
                : { background: "#fff", color: "#525252" }
            }
          >
            Automatic — run it for me daily
          </button>
        </div>
      </div>

      {cycleMode === "AUTOMATIC" && (
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-800">What time each day?</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AGENT_CYCLE_TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setTimeSlot(slot)}
                className="rounded-lg border px-3 py-2 text-sm font-medium transition"
                style={
                  timeSlot === slot
                    ? { background: "rgba(142,66,252,0.1)", borderColor: "#8E42FC", color: "#8E42FC" }
                    : { background: "#fff", borderColor: "#d4d4d4", color: "#525252" }
                }
              >
                {SLOT_LABELS[slot as AgentCycleTimeSlot]}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleContinue}
        disabled={loading}
        className="w-full rounded-md px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: "linear-gradient(120deg, #6229CE, #8E42FC 55%, #BC69EB)" }}
      >
        {loading ? "Saving…" : "Continue to pricing"}
      </button>
    </div>
  );
}
