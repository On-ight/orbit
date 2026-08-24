// Firebase client SDK — browser-only. Config values here are public by
// design (Firebase's own docs: these identify the project, they don't grant
// access on their own — Firebase Auth's actual security is enforced by the
// server verifying ID tokens/session cookies via lib/firebase/admin.ts).
"use client";

import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);

export const clientAuth = getAuth(app);
