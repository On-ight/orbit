import type { Metadata } from "next";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { KnowledgeBaseOnboardingForm } from "@/components/onboarding/KnowledgeBaseOnboardingForm";

export const metadata: Metadata = { title: "Set up your knowledge base" };

export default async function KnowledgeBaseOnboardingPage() {
  await requireCurrentUser();

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-16">
      <div className="mx-auto max-w-2xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">Step 1 of 3</p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
          Tell Orbit AI about your brand
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          This grounds every draft — without it, the AI can't tell your voice from generic filler.
          Fill in what you can; you can always add more later in Settings.
        </p>
        <div className="mt-8">
          <KnowledgeBaseOnboardingForm />
        </div>
      </div>
    </main>
  );
}
