// Uses Web Crypto (not Node's `crypto` module) so this also works unmodified
// inside Next.js middleware, which runs on the edge runtime.

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

export async function createSessionToken(): Promise<string> {
  const issuedAt = Date.now().toString();
  const signature = await hmacHex(issuedAt);
  return `${issuedAt}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;

  const expected = await hmacHex(issuedAt);
  if (!timingSafeEqualStr(expected, signature)) return false;

  const age = Date.now() - Number(issuedAt);
  if (Number.isNaN(age) || age < 0 || age > MAX_AGE_SECONDS * 1000) return false;

  return true;
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) throw new Error("DASHBOARD_PASSWORD is not set");
  return timingSafeEqualStr(expected, candidate);
}

export { COOKIE_NAME, MAX_AGE_SECONDS };
