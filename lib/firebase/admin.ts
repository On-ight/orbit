// Firebase Admin SDK — server-only. Verifies ID tokens/session cookies and
// creates/deletes Firebase users. Never import this from a "use client" file.
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

function getAdminApp() {
  const existing = getApps();
  if (existing.length > 0) return existing[0]!;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Env vars can't hold literal newlines — the key is stored with "\n"
  // escape sequences and unescaped here.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin is not configured — set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

let cachedAuth: Auth | null = null;

// Lazy on purpose — this module now gets imported on every marketing page
// (via Navbar's signed-in check), most of which never actually call this for
// an anonymous visitor. Initializing eagerly at module load meant just
// importing this file threw when Firebase env vars were unset, regardless of
// whether the request ever needed auth.
export function getAdminAuth(): Auth {
  if (!cachedAuth) {
    cachedAuth = getAuth(getAdminApp());
  }
  return cachedAuth;
}
