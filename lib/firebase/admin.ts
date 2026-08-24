// Firebase Admin SDK — server-only. Verifies ID tokens/session cookies and
// creates/deletes Firebase users. Never import this from a "use client" file.
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

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

export const adminAuth = getAuth(getAdminApp());
