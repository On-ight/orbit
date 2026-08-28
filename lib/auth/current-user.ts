import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";

export interface CurrentUser {
  id: string;
  email: string;
  isAdmin: boolean;
  accountId: string;
  account: {
    id: string;
    name: string;
    planTier: string | null;
    subscriptionStatus: string;
    autoApproveMode: boolean;
    agentCycleTimeSlot: string;
    cycleMode: string;
    onboardingCompletedAt: Date | null;
    discoveryKeywords: string | null;
  };
}

/**
 * Loads the logged-in user from the session cookie, with a live Firebase
 * revocation check — this is where a password change or disabled account
 * actually takes effect (proxy.ts only checks the cookie's own signature/
 * expiry, not this). Returns null if there's no valid session, the session
 * was revoked, or there's no matching User row.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  const payload = await verifySessionCookie(cookie, true);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { firebaseUid: payload.uid },
    include: { account: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
    accountId: user.accountId,
    account: {
      id: user.account.id,
      name: user.account.name,
      planTier: user.account.planTier,
      subscriptionStatus: user.account.subscriptionStatus,
      autoApproveMode: user.account.autoApproveMode,
      agentCycleTimeSlot: user.account.agentCycleTimeSlot,
      cycleMode: user.account.cycleMode,
      onboardingCompletedAt: user.account.onboardingCompletedAt,
      discoveryKeywords: user.account.discoveryKeywords,
    },
  };
}

/**
 * For page components only — redirects to /login if there's no valid live
 * session. API routes should use getCurrentUser() directly and return a 401
 * JSON response instead, since a redirect isn't appropriate there.
 */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
