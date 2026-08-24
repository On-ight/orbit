// Split out from lib/auth/session.ts so proxy.ts can read the cookie name
// without pulling in firebase-admin — its auth module (via jwks-rsa's
// bundled jose copy) doesn't bundle cleanly inside Next's proxy pipeline
// (ERR_REQUIRE_ESM), even though proxy.ts itself runs on the Node runtime.
export const COOKIE_NAME = "occ_session";
// Firebase's createSessionCookie caps expiresIn at 14 days — this is that
// ceiling, not an arbitrary choice.
export const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
