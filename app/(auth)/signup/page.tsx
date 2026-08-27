"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";

export default function SignupPage() {
  const router = useRouter();
  const [accountName, setAccountName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      body: JSON.stringify({ idToken, accountName }),
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
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl"
      >
        <div className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Orbit</p>
          <h1 className="mt-1 text-xl font-semibold text-neutral-100">Create your account</h1>
        </div>

        <label htmlFor="accountName" className="mb-1 block text-sm text-neutral-400">
          Brand / company name
        </label>
        <input
          id="accountName"
          type="text"
          autoFocus
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          className="mb-4 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-emerald-500"
        />

        <label htmlFor="email" className="mb-1 block text-sm text-neutral-400">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-emerald-500"
        />

        <label htmlFor="password" className="mb-1 block text-sm text-neutral-400">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-1 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-emerald-500"
        />
        <p className="mb-4 text-xs text-neutral-600">At least 6 characters.</p>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || !accountName || !email || !password}
          className="w-full rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-neutral-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="mt-4 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
