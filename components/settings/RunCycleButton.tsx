"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RunCycleButton() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/agents/run", { method: "POST" });
      const data = await res.json();
      // The route now only enqueues the cycle (it runs as a background job) —
      // it no longer waits for the run to finish, so there's no summary to
      // show yet. Refresh now and once more shortly after so the new
      // RUNNING/COMPLETED row shows up in Recent Runs below without a
      // manual reload.
      setResult(res.ok ? "Enqueued — check Recent Runs below shortly." : data.error);
      router.refresh();
      setTimeout(() => router.refresh(), 3000);
    } catch (err) {
      setResult(String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <button
        onClick={run}
        disabled={running}
        className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {running ? "Enqueuing…" : "Run agent cycle"}
      </button>
      {result && <p className="mt-3 text-xs text-[var(--text-muted)]">{result}</p>}
    </div>
  );
}
