import { prisma } from "@/lib/db/prisma";
import { BufferPlatform, isBufferConfiguredForPlatform, schedulePostToBuffer } from "@/lib/publishing/buffer-client";

const BUFFER_PLATFORMS: BufferPlatform[] = ["X", "THREADS", "LINKEDIN"];

/**
 * Publishes an 🟢 Auto-tier approval immediately, without a human click —
 * only ever called when the account has autoApproveMode enabled, and only
 * for approvals already classified riskTier "AUTO" by the agent that
 * created them (never NEVER, never a post — posts stay approval-gated by
 * policy regardless of this setting, see content-agent.ts).
 *
 * Deliberately kept separate from the "approve" branch of
 * app/api/approvals/[id]/route.ts rather than shared — that endpoint also
 * handles human-supplied edits/scheduling/image overrides that don't apply
 * here, and duplicating the simpler publish step means this can't
 * accidentally change the human-facing approve flow's behavior.
 */
export async function autoPublishApproval(approvalId: string): Promise<void> {
  const approval = await prisma.approval.findUnique({ where: { id: approvalId } });
  if (!approval || approval.riskTier !== "AUTO" || approval.status !== "PENDING") return;

  const bufferPlatform = BUFFER_PLATFORMS.find((p) => p === approval.platform);
  if (!bufferPlatform || !(await isBufferConfiguredForPlatform(approval.accountId, bufferPlatform))) {
    // Nothing to publish to yet — leave it pending so a human still sees it.
    return;
  }

  let bufferPostId: string;
  try {
    const result = await schedulePostToBuffer(approval.accountId, approval.content, bufferPlatform);
    bufferPostId = result.bufferPostId;
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
      publishedVia: "BUFFER",
      platformPostId: bufferPostId,
    },
  });

  if (approval.conversationId) {
    await prisma.conversation.update({ where: { id: approval.conversationId }, data: { status: "REPLIED" } });
  }
}
