// Thin wrapper around Firebase session cookies. Runs on the Node runtime
// (Next 16's proxy.ts defaults to Node, not edge, so the Admin SDK's network
// calls are fine here).
//
// proxy.ts uses the cheap check (checkRevoked: false — signature + expiry
// only, verified locally against Google's cached public keys, no network
// round trip per request). lib/auth/current-user.ts uses the live check
// (checkRevoked: true) since it already pays a DB round trip to load the
// User/Account row, so the extra Firebase revocation lookup is free by
// comparison — it catches a password change or account disable immediately
// instead of waiting up to MAX_AGE_SECONDS for the cookie to expire.
import { getAdminAuth } from "@/lib/firebase/admin";
import { COOKIE_NAME, MAX_AGE_SECONDS } from "@/lib/auth/cookie";

export interface SessionPayload {
  uid: string;
}

export async function createSessionCookie(idToken: string): Promise<string> {
  return getAdminAuth().createSessionCookie(idToken, { expiresIn: MAX_AGE_SECONDS * 1000 });
}

export async function verifySessionCookie(
  cookie: string | undefined | null,
  checkRevoked = false,
): Promise<SessionPayload | null> {
  if (!cookie) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookie, checkRevoked);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

export { COOKIE_NAME, MAX_AGE_SECONDS };
