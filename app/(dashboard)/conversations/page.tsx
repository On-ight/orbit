import { prisma } from "@/lib/db/prisma";
import { ConversationCard } from "@/components/conversations/ConversationCard";
import { requireCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

const INTENT_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export default async function ConversationsPage() {
  const currentUser = await requireCurrentUser();
  const conversations = await prisma.conversation.findMany({
    where: { accountId: currentUser.accountId },
    include: { approvals: { where: { status: "PENDING" }, select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });

  const sorted = [...conversations].sort(
    (a, b) => INTENT_ORDER[a.intent] - INTENT_ORDER[b.intent],
  );

  const highIntent = sorted.filter((c) => c.intent === "HIGH" && c.status !== "IGNORED");
  const flagged = sorted.filter((c) => c.riskTier === "NEVER" && c.status === "NEW");
  const rest = sorted.filter((c) => !highIntent.includes(c) && !flagged.includes(c));

  function toCardData(c: (typeof conversations)[number]) {
    return {
      id: c.id,
      authorHandle: c.authorHandle,
      authorName: c.authorName,
      originalText: c.originalText,
      likes: c.likes,
      replyCount: c.replyCount,
      intent: c.intent,
      topic: c.topic,
      potentialCustomer: c.potentialCustomer,
      riskTier: c.riskTier,
      aiRiskReasoning: c.aiRiskReasoning,
      aiDraftReply: c.aiDraftReply,
      recommendedAction: c.recommendedAction,
      status: c.status,
      pendingApprovalId: c.approvals[0]?.id ?? null,
    };
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Conversations</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Every mention the Community Agent has looked at, sorted by intent.
      </p>

      {conversations.length === 0 && (
        <p className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 text-sm text-[var(--text-muted)]">
          No conversations yet. Run an agent cycle from Settings to process mentions.
        </p>
      )}

      {flagged.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-[var(--status-critical)]">
            🚩 Flagged — needs manual review ({flagged.length})
          </h2>
          <div className="space-y-4">
            {flagged.map((c) => (
              <ConversationCard key={c.id} conversation={toCardData(c)} />
            ))}
          </div>
        </section>
      )}

      {highIntent.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-[var(--status-good)]">
            🔥 High intent ({highIntent.length})
          </h2>
          <div className="space-y-4">
            {highIntent.map((c) => (
              <ConversationCard key={c.id} conversation={toCardData(c)} />
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">
            Everything else ({rest.length})
          </h2>
          <div className="space-y-4">
            {rest.map((c) => (
              <ConversationCard key={c.id} conversation={toCardData(c)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
