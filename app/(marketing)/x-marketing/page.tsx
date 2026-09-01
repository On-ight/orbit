import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI X (Twitter) Marketing Tool",
  description:
    "Orbit AI is an AI agent for X marketing — it researches trends, drafts posts and replies within X's 280-character limit, and queues them for your approval.",
};

export default function XMarketingPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">X marketing</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          An AI agent for X marketing
        </h1>
        <p className="mt-6 text-lg text-neutral-600">
          X moves fast and rewards showing up consistently — which is exactly what&apos;s hardest to do
          while you&apos;re also running the business. Orbit AI drafts posts and reply suggestions in your
          voice, tuned to X&apos;s 280-character limit, and queues them for a quick approval instead of
          asking you to write from a blank box every day.
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
          <h2 className="text-2xl font-semibold tracking-tight">How Orbit AI handles X specifically</h2>
          <div className="mt-10 space-y-8">
            <div>
              <h3 className="font-medium">Every draft fits, every time</h3>
              <p className="mt-1 text-neutral-600">
                X&apos;s 280-character limit is enforced on every draft before it reaches your queue — no
                truncated posts, no manual counting.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Reply drafts, not just original posts</h3>
              <p className="mt-1 text-neutral-600">
                Orbit AI reads real replies and mentions and drafts a response — flagged by intent (a
                real question, a potential customer, noise) so you spend your attention on the
                conversations that matter.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Trend-aware, not templated</h3>
              <p className="mt-1 text-neutral-600">
                Instead of a fixed content calendar, Orbit AI researches what&apos;s actually being discussed
                around your product and industry right now, and drafts posts worth reacting to that day.
              </p>
            </div>
            <div>
              <h3 className="font-medium">You control the risk</h3>
              <p className="mt-1 text-neutral-600">
                Routine posts can publish automatically. Anything ambiguous — pricing questions, public
                complaints, anything sensitive — waits for a human. You set where that line is.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">What that looks like</h2>
          <p className="mt-2 text-sm text-neutral-500">Illustrative examples, not real customer posts.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Product update</p>
              <p className="mt-2 text-sm text-neutral-700">
                &quot;We just shipped scheduled publishing — drafts now queue themselves while you sleep.&quot;
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Trend reaction</p>
              <p className="mt-2 text-sm text-neutral-700">
                &quot;Everyone&apos;s talking about AI agents this week — here&apos;s the one thing most takes are
                getting wrong about approval workflows.&quot;
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Reply draft</p>
              <p className="mt-2 text-sm text-neutral-700">
                &quot;Great question — right now we support X, Threads, and LinkedIn, with more on the roadmap.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Other platforms Orbit AI covers</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link href="/threads-marketing" className="rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-400">
              <p className="font-medium">Threads</p>
              <p className="mt-1 text-sm text-neutral-600">Longer-form, conversational posting.</p>
            </Link>
            <Link href="/linkedin-marketing" className="rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-400">
              <p className="font-medium">LinkedIn</p>
              <p className="mt-1 text-sm text-neutral-600">Company Page posts for B2B distribution.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Let Orbit AI draft your next X post.
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
