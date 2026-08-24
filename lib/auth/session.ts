// Uses Web Crypto (not Node's `crypto` module) so this also works unmodified
// inside proxy.ts, which runs on the edge runtime.
//
// The token carries identity only (userId + tokenVersion) — never mutable
// authorization state (isAdmin, plan/subscription status). Those get checked
// live against the database wherever they matter (see lib/auth/current-user.ts),
// so revoking a user (password change, suspension) takes effect immediately by
// bumping User.tokenVersion, without needing to rotate SESSION_SECRET and log
// every session out at once. This file only answers "is this cookie a real,
// unexpired, untampered session" — not "is this account allowed to do X."

const COOKIE_NAME = "occ_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return secret;
}

async function hmacHex(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signatureBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export interface SessionPayload {
  userId: string;
  tokenVersion: number;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const issuedAt = Date.now().toString();
  const body = `${payload.userId}.${payload.tokenVersion}.${issuedAt}`;
  const signature = await hmacHex(body);
  return `${body}.${signature}`;
}

/**
 * Verifies signature + expiry only — this is the cheap, DB-free check
 * appropriate for proxy.ts's edge runtime. It does NOT confirm the user still
 * exists, isn't suspended, or that tokenVersion still matches the live row;
 * callers that need those guarantees must check the live User row (see
 * lib/auth/current-user.ts).
 */
export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [userId, tokenVersionStr, issuedAt, signature] = parts;
  if (!userId || !tokenVersionStr || !issuedAt || !signature) return null;

  const body = `${userId}.${tokenVersionStr}.${issuedAt}`;
  const expected = await hmacHex(body);
  if (!timingSafeEqualStr(expected, signature)) return null;

  const age = Date.now() - Number(issuedAt);
  if (Number.isNaN(age) || age < 0 || age > MAX_AGE_SECONDS * 1000) return null;

  const tokenVersion = Number(tokenVersionStr);
  if (!Number.isInteger(tokenVersion)) return null;

  return { userId, tokenVersion };
}

export { COOKIE_NAME, MAX_AGE_SECONDS };
