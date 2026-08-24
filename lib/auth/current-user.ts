import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

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
  };
}

/**
 * Loads the logged-in user from the session cookie, live from the database —
 * this is where tokenVersion is actually checked against the current User
 * row (proxy.ts only checks the cookie's own signature/expiry, not this).
 * Returns null if there's no valid session, the user no longer exists, or
 * tokenVersion has been bumped (password changed / session revoked) since
 * the cookie was issued.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { account: true },
  });
  if (!user) return null;
  if (user.tokenVersion !== payload.tokenVersion) return null;

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
    },
  };
}

/**
 * For page components only — redirects to /login if there's no valid live
 * session (covers the edge case proxy.ts can't catch: a cookie that's still
 * validly signed and unexpired, but whose tokenVersion was revoked, or whose
 * User row no longer exists). API routes should use getCurrentUser() directly
 * and return a 401 JSON response instead, since a redirect isn't appropriate
 * there.
 */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
