"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS, type AccountType } from "@/lib/types";

export default function SignupPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [accountName, setAccountName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nameLabel = accountType === "COMPANY" ? "Company name" : "Your name";
  const readyForAccountCreation = Boolean(accountType) && accountName.trim().length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let credential;
    try {
      credential = await createUserWithEmailAndPassword(clientAuth, email, password);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      setError(
        code === "auth/email-already-in-use"
          ? "An account with that email already exists."
          : code === "auth/weak-password"
            ? "Password must be at least 6 characters."
            : "Something went wrong.",
      );
      setLoading(false);
      return;
    }

    const idToken = await credential.user.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, accountName, accountType }),
    });

    if (!res.ok) {
      // Orbit-side account creation failed after Firebase succeeded — undo
      // the Firebase signup so retrying isn't blocked by "email in use".
      await credential.user.delete().catch(() => {});
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    router.push("/onboarding/knowledge-base");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/">
            <Image src="/orbit-logo.png" alt="Orbit" width={612} height={408} className="h-10 w-auto" />
          </Link>
          <h1 className="mt-3 text-lg font-semibold text-neutral-900">Create your account</h1>
        </div>

        <p className="mb-1.5 block text-sm text-neutral-600">Which best describes you?</p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {ACCOUNT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setAccountType(type)}
              className="rounded-md border px-3 py-2 text-sm font-medium transition"
              style={
                accountType === type
                  ? { background: "rgba(142,66,252,0.1)", borderColor: "#8E42FC", color: "#8E42FC" }
                  : { background: "#fff", borderColor: "#d4d4d4", color: "#525252" }
              }
            >
              {ACCOUNT_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        <label htmlFor="accountName" className="mb-1 block text-sm text-neutral-600">
          {nameLabel}
        </label>
        <input
          id="accountName"
          type="text"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          className="mb-4 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 outline-none transition focus:border-[#8E42FC] focus:ring-1 focus:ring-[#8E42FC]"
        />

        <SocialAuthButtons
          accountName={accountName.trim()}
          accountType={accountType ?? undefined}
          disabled={!readyForAccountCreation}
          onError={setError}
        />
        {!readyForAccountCreation && (
          <p className="mt-1.5 text-xs text-neutral-400">
            Pick a type and fill in {accountType === "COMPANY" ? "a company name" : "your name"} to
            enable these.
          </p>
        )}

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-200" />
          <p className="text-xs text-neutral-400">or</p>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <label htmlFor="email" className="mb-1 block text-sm text-neutral-600">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 outline-none transition focus:border-[#8E42FC] focus:ring-1 focus:ring-[#8E42FC]"
        />

        <label htmlFor="password" className="mb-1 block text-sm text-neutral-600">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 outline-none transition focus:border-[#8E42FC] focus:ring-1 focus:ring-[#8E42FC]"
        />
        <p className="mb-4 text-xs text-neutral-500">At least 6 characters.</p>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !readyForAccountCreation || !email || !password}
          className="w-full rounded-md px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "linear-gradient(120deg, #6229CE, #8E42FC 55%, #BC69EB)" }}
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="mt-4 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#8E42FC] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
