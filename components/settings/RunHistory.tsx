"use client";

import { useState } from "react";

interface Run {
  id: string;
  status: string;
  startedAt: Date;
  summary: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: "var(--status-good)",
  FAILED: "var(--status-critical)",
  RUNNING: "var(--status-warning)",
};

export function RunHistory({ runs }: { runs: Run[] }) {
  const [open, setOpen] = useState(false);

  if (runs.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No runs yet.</p>;
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-medium text-[var(--accent)] hover:underline"
      >
        {open ? "Hide run history" : `View run history (${runs.length})`}
      </button>
      {open && (
        <ul className="mt-3 space-y-2">
          {runs.map((run) => (
            <li key={run.id} className="text-xs text-[var(--text-secondary)]">
              <span className="font-medium" style={{ color: STATUS_COLOR[run.status] ?? "var(--text-secondary)" }}>
                {run.status}
              </span>{" "}
              · {new Date(run.startedAt).toLocaleString()} · {run.summary ?? "in progress"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
