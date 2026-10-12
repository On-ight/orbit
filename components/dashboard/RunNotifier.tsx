"use client";

import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 20_000;
const LAST_SEEN_KEY = "orbit:lastSeenRunId";
const AUTO_DISMISS_MS = 10_000;

interface LatestRun {
  id: string;
  status: string;
  summary: string | null;
  completedAt: string | null;
}

function readLastSeenId(): string | null {
  try {
    return localStorage.getItem(LAST_SEEN_KEY);
  } catch {
    return null;
  }
}

function writeLastSeenId(id: string): void {
  try {
    localStorage.setItem(LAST_SEEN_KEY, id);
  } catch {
    // Private browsing / blocked storage — the toast still works for this
    // tab's session, it just won't dedupe across reloads.
  }
}

/**
 * Polls for the account's latest agent run and shows a toast top-right the
 * moment a new one finishes — there's no websocket/SSE infra here, so this
 * is short-interval polling from the browser rather than a server push.
 * Renders nothing visible until there's something to show.
 */
export function RunNotifier() {
  const [toast, setToast] = useState<LatestRun | null>(null);
  const lastSeenIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    lastSeenIdRef.current = readLastSeenId();

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/runs/latest");
        if (!res.ok) return;
        const data = await res.json();
        const run: LatestRun | null = data?.run ?? null;
        if (cancelled || !run || !run.completedAt) return;

        // First poll ever on this browser (no stored id yet) — just
        // establish a baseline silently rather than toasting about a run
        // that may have finished long before this tab was ever opened.
        if (!initializedRef.current) {
          initializedRef.current = true;
          if (lastSeenIdRef.current === null) {
            lastSeenIdRef.current = run.id;
            writeLastSeenId(run.id);
            return;
          }
        }

        if (run.id !== lastSeenIdRef.current) {
          lastSeenIdRef.current = run.id;
          writeLastSeenId(run.id);
          setToast(run);
        }
      } catch {
        // Network hiccup — next poll tries again, nothing to surface here.
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), AUTO_DISMISS_MS);
    return () => clearTimeout(timeout);
  }, [toast]);

  if (!toast) return null;

  const isFailed = toast.status === "FAILED";

  return (
    <div
      role="status"
      className="fixed right-4 top-4 z-50 w-80 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-lg"
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: isFailed ? "var(--status-critical)" : "var(--status-good)" }}
        >
          {isFailed ? "Agent run failed" : "Agent run completed"}
        </span>
        <button
          onClick={() => setToast(null)}
          aria-label="Dismiss"
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          ✕
        </button>
      </div>
      <p className="text-xs text-[var(--text-secondary)]">{toast.summary ?? "No summary available."}</p>
    </div>
  );
}
