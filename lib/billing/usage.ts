import { prisma } from "@/lib/db/prisma";

// "AI generation" spans both output types the agents produce: a drafted
// Post (Content Agent) and a drafted reply Approval (Community Agent).
// Derived from existing rows rather than a separate counter, so there's
// nothing to keep in sync or reset — the window is simply "this calendar
// month so far."
export async function countAiGenerationsThisMonth(accountId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [posts, replyApprovals] = await Promise.all([
    prisma.post.count({ where: { accountId, createdAt: { gte: startOfMonth } } }),
    prisma.approval.count({ where: { accountId, type: "REPLY", createdAt: { gte: startOfMonth } } }),
  ]);

  return posts + replyApprovals;
}

// Reels are counted separately from countAiGenerationsThisMonth — real
// per-unit vendor cost (video render + voiceover), a stricter cap than text
// generations, checked at the point rendering is actually triggered (not at
// script-drafting time, which is cheap LLM-only work).
export async function countReelsThisMonth(accountId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  return prisma.approval.count({ where: { accountId, type: "REEL", createdAt: { gte: startOfMonth } } });
}

// Counted separately from Reels — Carousels render via next/og in-process
// (no per-unit vendor cost like HeyGen's avatar render), so this cap exists
// to bound LLM-call volume, not vendor spend, and can be more generous.
export async function countCarouselsThisMonth(accountId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  return prisma.approval.count({ where: { accountId, type: "CAROUSEL", createdAt: { gte: startOfMonth } } });
}

// Distinct from countAiGenerationsThisMonth — that one bounds draft/LLM-call
// volume (Post rows created), this one bounds the number actually approved/
// published (the number the pricing page advertises). Scoped to type "POST"
// only (not REPLY) and counted by resolvedAt (when the approve action ran),
// not createdAt (when it was drafted), since the cap is about publish
// volume for a given month, not draft age.
export async function countPublishedPostsThisMonth(accountId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  return prisma.approval.count({
    where: { accountId, type: "POST", status: "APPROVED", resolvedAt: { gte: startOfMonth } },
  });
}

// Checked by every app/api/connections/{platform}/start/route.ts before
// redirecting into that platform's OAuth flow. Reconnecting a platform
// that's already connected never counts as "new" — only adding a platform
// beyond maxConnectedAccounts is blocked.
export async function canConnectAnotherPlatform(
  accountId: string,
  platform: string,
  maxConnectedAccounts: number,
): Promise<boolean> {
  const existing = await prisma.accountSocialToken.findUnique({
    where: { accountId_platform: { accountId, platform } },
  });
  if (existing) return true;

  const count = await prisma.accountSocialToken.count({ where: { accountId } });
  return count < maxConnectedAccounts;
}
