"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface KnowledgeBaseEntryData {
  id: string;
  title: string;
  content: string;
}

export function KnowledgeBaseManager({ entries }: { entries: KnowledgeBaseEntryData[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to add entry");
      }
      setTitle("");
      setContent("");
      setAdding(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/knowledge-base/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <ul className="mb-4 space-y-2">
        {entries.map((entry) => (
          <li key={entry.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                className="text-left text-sm font-medium text-[var(--text-primary)] hover:underline"
              >
                {entry.title}
              </button>
              <button
                disabled={busy}
                onClick={() => handleDelete(entry.id)}
                className="text-xs text-[var(--status-critical)] hover:underline disabled:opacity-50"
              >
                Delete
              </button>
            </div>
            {expanded === entry.id && (
              <p className="mt-2 whitespace-pre-wrap text-xs text-[var(--text-secondary)]">{entry.content}</p>
            )}
          </li>
        ))}
        {entries.length === 0 && <p className="text-sm text-[var(--text-muted)]">No entries yet.</p>}
      </ul>

      {adding ? (
        <div className="space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Content"
            rows={5}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
          {error && <p className="text-xs text-[var(--status-critical)]">{error}</p>}
          <div className="flex gap-2">
            <button
              disabled={busy || !title.trim() || !content.trim()}
              onClick={handleAdd}
              className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Add entry
            </button>
            <button
              disabled={busy}
              onClick={() => setAdding(false)}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          + Add entry
        </button>
      )}
    </div>
  );
}
