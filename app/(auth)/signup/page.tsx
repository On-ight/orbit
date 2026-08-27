"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
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
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/orbit-logo.png" alt="Orbit" width={612} height={408} className="h-10 w-auto" />
          <h1 className="mt-3 text-lg font-semibold text-neutral-900">Create your account</h1>
        </div>

        <label htmlFor="accountName" className="mb-1 block text-sm text-neutral-600">
          Brand / company name
        </label>
        <input
          id="accountName"
          type="text"
          autoFocus
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          className="mb-4 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 outline-none transition focus:border-[#8E42FC] focus:ring-1 focus:ring-[#8E42FC]"
        />

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
          disabled={loading || !accountName || !email || !password}
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
