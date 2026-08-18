"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiskBadge } from "@/components/dashboard/Badge";

export interface ApprovalCardData {
  id: string;
  type: string;
  status: string;
  platform: string;
  content: string;
  editedContent: string | null;
  aiReasoning: string;
  confidence: number;
  riskTier: string;
  createdAt: string;
  conversation: { authorHandle: string; originalText: string } | null;
}

const TYPE_LABEL: Record<string, string> = {
  POST: "📝 Post",
  REPLY: "💬 Reply",
  COMMUNITY_INVITE: "🤝 Community invite",
};

export function ApprovalCard({
  approval,
  xConfigured,
  bufferConfigured,
}: {
  approval: ApprovalCardData;
  xConfigured: boolean;
  bufferConfigured: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(approval.editedContent ?? approval.content);
  const [scheduledFor, setScheduledFor] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "approve" | "reject" | "edit") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/approvals/${approval.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          editedContent: action !== "reject" && draft !== approval.content ? draft : undefined,
          scheduledFor:
            action === "approve" && bufferConfigured && scheduledFor
              ? new Date(scheduledFor).toISOString()
              : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const displayContent = approval.editedContent ?? approval.content;
  const canPublishLive = bufferConfigured || (approval.type === "POST" && xConfigured);

  function publishNote(): string {
    if (bufferConfigured) {
      return scheduledFor
        ? `Approving this will schedule it via Buffer for ${new Date(scheduledFor).toLocaleString()}.`
        : "Approving this will queue it via Buffer for the next available slot.";
    }
    if (approval.type === "POST" && xConfigured) {
      return "Approving this will publish it live to X immediately.";
    }
    return "No publishing connection configured — approving this will only mark it published in the demo pipeline.";
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {TYPE_LABEL[approval.type] ?? approval.type}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {approval.platform} · {new Date(approval.createdAt).toLocaleString()}
          </span>
        </div>
        <RiskBadge tier={approval.riskTier} />
      </div>

      {approval.conversation && (
        <div className="mb-3 rounded-lg bg-[var(--surface-2)] p-3 text-sm text-[var(--text-secondary)]">
          <p className="mb-1 text-xs font-medium text-[var(--text-muted)]">
            Original · @{approval.conversation.authorHandle}
          </p>
          <p>&ldquo;{approval.conversation.originalText}&rdquo;</p>
        </div>
      )}

      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          className="mb-3 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
      ) : (
        <p className="mb-3 whitespace-pre-wrap text-sm text-[var(--text-primary)]">
          {displayContent}
        </p>
      )}

      <p className="mb-2 text-xs text-[var(--text-muted)]">
        AI reasoning: {approval.aiReasoning} · Confidence: {Math.round(approval.confidence * 100)}%
      </p>

      <p
        className="mb-2 text-xs font-medium"
        style={{ color: canPublishLive ? "var(--status-good)" : "var(--text-muted)" }}
      >
        {publishNote()}
      </p>

      {bufferConfigured && !editing && (
        <label className="mb-4 block text-xs text-[var(--text-muted)]">
          Schedule for (optional — leave blank to queue immediately)
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="mt-1 block rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
        </label>
      )}

      {error && (
        <p className="mb-4 rounded-md bg-[var(--status-critical-soft)] px-3 py-2 text-xs text-[var(--status-critical)]">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        {editing ? (
          <>
            <button
              disabled={busy}
              onClick={() => act("edit")}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
            >
              Save edit
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setDraft(displayContent);
                setEditing(false);
              }}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              disabled={busy}
              onClick={() => setEditing(true)}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
            >
              Edit
            </button>
            <button
              disabled={busy}
              onClick={() => act("approve")}
              className="rounded-md bg-[var(--status-good)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              ✓ Approve
            </button>
            <button
              disabled={busy}
              onClick={() => act("reject")}
              className="rounded-md border border-[var(--status-critical)] px-3 py-1.5 text-xs font-medium text-[var(--status-critical)] hover:bg-[var(--status-critical-soft)] disabled:opacity-50"
            >
              ✕ Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
}
