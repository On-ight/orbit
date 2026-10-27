import { prisma } from "@/lib/db/prisma";
import { isXConnected, publishPostToX } from "@/lib/publishing/x-client";

/**
 * Publishes an 🟢 Auto-tier approval immediately, without a human click —
 * only ever called when the account has autoApproveMode enabled, and only
 * for approvals already classified riskTier "AUTO" by the agent that
 * created them (never NEVER, never a post — posts stay approval-gated by
 * policy regardless of this setting, see content-agent.ts). Only REPLY
 * approvals reach here today (community-agent.ts), always platform "X".
 *
 * Deliberately kept separate from the "approve" branch of
 * app/api/approvals/[id]/route.ts rather than shared — that endpoint also
 * handles human-supplied edits/scheduling/image overrides that don't apply
 * here, and duplicating the simpler publish step means this can't
 * accidentally change the human-facing approve flow's behavior.
 */
export async function autoPublishApproval(approvalId: string): Promise<void> {
  const approval = await prisma.approval.findUnique({
    where: { id: approvalId },
    include: {
      conversation: { select: { sourceMention: { select: { platformPostId: true } } } },
    },
  });
  if (!approval || approval.riskTier !== "AUTO" || approval.status !== "PENDING") return;
  if (approval.platform !== "X" || !(await isXConnected(approval.accountId))) {
    // Nothing to publish to yet — leave it pending so a human still sees it.
    return;
  }

  let platformPostId: string;
  try {
    const replyToTweetId =
      approval.type === "REPLY" ? approval.conversation?.sourceMention.platformPostId : undefined;
    const result = await publishPostToX(approval.accountId, approval.content, replyToTweetId);
    platformPostId = result.platformPostId;
  } catch {
    // Fail-safe: a publish failure must never vanish silently — leaving it
    // pending just means it stops being "automatic" and falls back to
    // manual review, the same posture used elsewhere in this codebase.
    return;
  }

  await prisma.approval.update({
    where: { id: approvalId },
    data: {
      status: "APPROVED",
      resolvedAt: new Date(),
      publishedVia: "X",
      platformPostId,
    },
  });

  if (approval.conversationId) {
    await prisma.conversation.update({ where: { id: approval.conversationId }, data: { status: "REPLIED" } });
  }
}
