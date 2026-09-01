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
