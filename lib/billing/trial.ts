import { prisma } from "@/lib/db/prisma";

export const TRIAL_DURATION_MS = 4 * 24 * 60 * 60 * 1000;

export function isTrialExpired(account: { planTier: string | null; trialEndsAt: Date | null }): boolean {
  return account.planTier === "FREE" && account.trialEndsAt !== null && account.trialEndsAt.getTime() < Date.now();
}

/**
 * Flips one account out of "active" once its trial window has passed.
 * Conditioned on the current DB state (not just the caller's in-memory
 * copy) so this is safe to call speculatively on every request — a no-op
 * once already flipped.
 */
export async function expireTrialForAccount(accountId: string): Promise<void> {
  await prisma.account.updateMany({
    where: { id: accountId, planTier: "FREE", subscriptionStatus: "active", trialEndsAt: { lt: new Date() } },
    data: { subscriptionStatus: "trial_expired" },
  });
}

/**
 * Bulk sweep for accounts nobody is actively browsing — without this, an
 * account that never logs back in would keep matching the cron's
 * subscriptionStatus: "active" filter forever and keep consuming free-tier
 * agent cycles past its trial window.
 */
export async function expireAllOverdueTrials(): Promise<number> {
  const result = await prisma.account.updateMany({
    where: { planTier: "FREE", subscriptionStatus: "active", trialEndsAt: { lt: new Date() } },
    data: { subscriptionStatus: "trial_expired" },
  });
  return result.count;
}
