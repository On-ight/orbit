import type { Metadata } from "next";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { AutomationOnboardingForm } from "@/components/onboarding/AutomationOnboardingForm";

export const metadata: Metadata = { title: "Choose how Orbit AI runs" };

export default async function AutomationOnboardingPage() {
  await requireCurrentUser();

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">Step 2 of 3</p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Set your automation</h1>
        <p className="mt-2 text-sm text-neutral-600">
          You can change this any time in Settings — this just sets where you start.
        </p>
        <div className="mt-8">
          <AutomationOnboardingForm />
        </div>
      </div>
    </main>
  );
}
