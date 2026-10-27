"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";

const googleProvider = new GoogleAuthProvider();

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

/**
 * accountName present (even empty-string-checked by the caller via
 * `disabled`) = signup context, sent to /api/auth/session to create a new
 * Account if this identity has never signed in before. Omit entirely on
 * the login page — an existing user shouldn't get a new Account created
 * just because they signed in with a different provider than before... though
 * note that's a real limitation: this doesn't link a new provider to an
 * existing email/password account, it's treated as a fresh identity by
 * Firebase unless account linking is added later.
 *
 * Microsoft sign-in was removed here (2026-10-27) — it was never configured
 * in Firebase/Azure, so the button failed for every single visitor. Add it
 * back (OAuthProvider("microsoft.com"), same handleProvider pattern) once
 * an actual Azure App Registration exists.
 */
export function SocialAuthButtons({
  accountName,
  accountType,
  disabled,
  onError,
}: {
  accountName?: string;
  accountType?: string;
  disabled?: boolean;
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleGoogle() {
    setPending(true);
    onError("");

    try {
      const credential = await signInWithPopup(clientAuth, googleProvider);
      const idToken = await credential.user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountName ? { idToken, accountName, accountType } : { idToken }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        onError(
          res.status === 404
            ? "No Orbit account for this sign-in yet — use Sign up instead."
            : (data?.error ?? "Something went wrong with Google."),
        );
        setPending(false);
        return;
      }

      router.push(accountName ? "/onboarding/knowledge-base" : "/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setPending(false);
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return; // user just closed the popup — not an error
      }
      if (code === "auth/account-exists-with-different-credential") {
        onError("An account already exists with this email using a different sign-in method.");
        return;
      }
      if (code === "auth/operation-not-allowed") {
        onError("Google sign-in isn't enabled yet — contact support.");
        return;
      }
      onError("Something went wrong with Google.");
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={handleGoogle}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <GoogleIcon />
      {pending ? "Signing in…" : "Continue with Google"}
    </button>
  );
}
