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
      setResult(res.ok ? data.summary : data.error);
      router.refresh();
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
        {running ? "Running agent cycle…" : "Run agent cycle"}
      </button>
      {result && <p className="mt-3 text-xs text-[var(--text-muted)]">{result}</p>}
    </div>
  );
}
