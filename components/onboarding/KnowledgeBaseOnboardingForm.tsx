"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  {
    title: "Brand voice & identity",
    placeholder: "How does your brand sound? Formal or casual? Any words/phrases you always or never use?",
  },
  {
    title: "Content pillars & topics",
    placeholder: "What themes should posts rotate through? What's genuinely worth posting about?",
  },
  {
    title: "Product features",
    placeholder: "What does your product actually do today? Avoid claiming features that aren't live yet.",
  },
  {
    title: "Safety & compliance rules",
    placeholder: "Anything the AI should never say or claim — regulatory limits, competitor mentions, etc.",
  },
  {
    title: "Founder story",
    placeholder: "Why does this exist? Useful for authentic build-in-public style posts.",
  },
];

export function KnowledgeBaseOnboardingForm() {
  const router = useRouter();
  const [values, setValues] = useState<string[]>(CATEGORIES.map(() => ""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filledCount = values.filter((v) => v.trim().length > 0).length;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (filledCount === 0) {
      setError("Fill in at least one section before continuing.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      for (let i = 0; i < CATEGORIES.length; i++) {
        const content = values[i].trim();
        if (!content) continue;
        const res = await fetch("/api/knowledge-base", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: CATEGORIES[i].title, content }),
        });
        if (!res.ok) throw new Error("Failed to save one of the sections — try again.");
      }
      router.push("/onboarding/automation");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {CATEGORIES.map((category, i) => (
        <div key={category.title}>
          <label className="mb-1 block text-sm font-medium text-neutral-800">{category.title}</label>
          <textarea
            value={values[i]}
            onChange={(e) => {
              const next = [...values];
              next[i] = e.target.value;
              setValues(next);
            }}
            placeholder={category.placeholder}
            rows={3}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500"
          />
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-neutral-500">{filledCount} of {CATEGORIES.length} filled in</p>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "linear-gradient(120deg, #6229CE, #8E42FC 55%, #BC69EB)" }}
        >
          {loading ? "Saving…" : "Continue"}
        </button>
      </div>
    </form>
  );
}
