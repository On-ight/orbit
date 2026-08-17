"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IntentBadge, RiskBadge } from "@/components/dashboard/Badge";

export interface ConversationCardData {
  id: string;
  authorHandle: string;
  authorName: string;
  originalText: string;
  likes: number;
  replyCount: number;
  intent: string;
  topic: string;
  potentialCustomer: boolean;
  riskTier: string;
  aiRiskReasoning: string | null;
  aiDraftReply: string | null;
  recommendedAction: string;
  status: string;
  pendingApprovalId: string | null;
}

export function ConversationCard({ conversation }: { conversation: ConversationCardData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(conversation.aiDraftReply ?? "");
  const [busy, setBusy] = useState(false);

  const isFlagged = conversation.riskTier === "NEVER";
  const isResolved = conversation.status === "REPLIED" || conversation.status === "IGNORED";

  async function handleReply() {
    if (!conversation.pendingApprovalId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/approvals/${conversation.pendingApprovalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          editedContent: draft !== conversation.aiDraftReply ? draft : undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleIgnore() {
    setBusy(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ignore" }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            @{conversation.authorHandle}
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            &ldquo;{conversation.originalText}&rdquo;
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {conversation.likes} likes · {conversation.replyCount} replies
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <IntentBadge intent={conversation.intent} />
          <RiskBadge tier={conversation.riskTier} />
        </div>
      </div>

      <div className="my-4 border-t border-[var(--border)]" />

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        AI analysis
      </p>
      <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-[var(--text-muted)]">Topic</dt>
          <dd className="text-[var(--text-secondary)]">{conversation.topic}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-muted)]">Potential customer</dt>
          <dd className="text-[var(--text-secondary)]">{conversation.potentialCustomer ? "Yes" : "No"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-[var(--text-muted)]">Recommended action</dt>
          <dd className="text-[var(--text-secondary)]">{conversation.recommendedAction}</dd>
        </div>
      </dl>

      {isFlagged ? (
        <div className="rounded-lg border border-[var(--status-critical)] bg-[var(--status-critical-soft)] p-3">
          <p className="text-sm font-medium text-[var(--status-critical)]">
            🧠 Why this matters: flagged for manual review
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {conversation.aiRiskReasoning ??
              "This touches a sensitive topic (complaint, politics, or an unverified claim). The AI will not draft a reply — please handle this one yourself."}
          </p>
        </div>
      ) : conversation.aiDraftReply || editing ? (
        <>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            AI draft
          </p>
          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="mb-3 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
          ) : (
            <p className="mb-3 whitespace-pre-wrap rounded-lg bg-[var(--surface-2)] p-3 text-sm text-[var(--text-primary)]">
              {draft}
            </p>
          )}
        </>
      ) : null}

      {!isResolved && (
        <div className="flex gap-2">
          {!isFlagged && conversation.pendingApprovalId && (
            <>
              <button
                disabled={busy}
                onClick={() => setEditing((v) => !v)}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
              >
                {editing ? "Done editing" : "Edit"}
              </button>
              <button
                disabled={busy}
                onClick={handleReply}
                className="rounded-md bg-[var(--status-good)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                Reply
              </button>
            </>
          )}
          <button
            disabled={busy}
            onClick={handleIgnore}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            Ignore
          </button>
        </div>
      )}

      {isResolved && (
        <p className="text-xs font-medium text-[var(--text-muted)]">
          {conversation.status === "REPLIED" ? "✓ Replied" : "Ignored"}
        </p>
      )}
    </div>
  );
}
