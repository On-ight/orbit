import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Threads Marketing Tool",
  description:
    "Orbit AI is an AI agent for Threads marketing — it drafts longer-form, conversational posts and replies, and helps you keep a consistent presence without writing every post yourself.",
};

export default function ThreadsMarketingPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">Threads marketing</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          An AI agent for Threads marketing
        </h1>
        <p className="mt-6 text-lg text-neutral-600">
          Threads rewards a more conversational, build-in-public voice than X — recaps, behind-the-scenes
          updates, and genuine replies tend to outperform anything that reads like an announcement.
          Orbit AI drafts in that register specifically, not a shorter version of your X posts pasted
          into a different app.
        </p>
        <div className="mt-10">
          <Link
            href="/signup"
            className="rounded-md bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Start free
          </Link>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">How Orbit AI handles Threads specifically</h2>
          <div className="mt-10 space-y-8">
            <div>
              <h3 className="font-medium">Longer-form drafts, not X posts squeezed to fit</h3>
              <p className="mt-1 text-neutral-600">
                Threads gives you more room than X's 280 characters — Orbit AI drafts to Threads' own
                limit and tone instead of reusing the same short-form copy across every platform.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Build-in-public recaps, drafted from what actually happened</h3>
              <p className="mt-1 text-neutral-600">
                Orbit AI can turn a week's worth of shipped features, fixes, and decisions into a recap
                post worth sharing — grounded in your actual work, not generic filler.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Real conversation replies</h3>
              <p className="mt-1 text-neutral-600">
                Replies are drafted per conversation and tagged by intent, so a genuine question from a
                potential customer gets a thoughtful draft, not a templated one-liner.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Other platforms Orbit AI covers</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link href="/x-marketing" className="rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-400">
              <p className="font-medium">X</p>
              <p className="mt-1 text-sm text-neutral-600">280-character posts and reply drafts.</p>
            </Link>
            <Link href="/linkedin-marketing" className="rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-400">
              <p className="font-medium">LinkedIn</p>
              <p className="mt-1 text-sm text-neutral-600">Company Page posts for B2B distribution.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Let Orbit AI draft your next Threads post.
          </h2>
          <div className="mt-8">
            <Link
              href="/signup"
              className="rounded-md bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
            >
              Start free
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
