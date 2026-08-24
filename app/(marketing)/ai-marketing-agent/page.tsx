import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Marketing Agent",
  description:
    "Orbit AI is an AI marketing agent — it researches, drafts, and helps publish social media content across X, Threads, and LinkedIn, with a human approval queue instead of a black box.",
};

const NOT_A = [
  {
    title: "Not a scheduler",
    detail:
      "A scheduler still needs you to write the post. Orbit AI writes the draft first — scheduling is the last, smallest step, not the whole product.",
  },
  {
    title: "Not a generic AI writer",
    detail:
      "A blank \"write me a tweet\" prompt produces generic copy. Orbit AI is grounded in your brand voice, your product, and your safety rules — set once, applied to every draft.",
  },
  {
    title: "Not a black box",
    detail:
      "Every draft carries its own risk tier and the reasoning behind it. You can see why Orbit AI thinks something is safe to auto-publish, not just trust that it is.",
  },
];

const WORKFLOW = [
  {
    step: "Research",
    detail:
      "Orbit AI runs live web research tuned to your product and industry — not a static content calendar template, actual current trends and conversations worth responding to.",
  },
  {
    step: "Draft",
    detail:
      "Drafts are generated per platform, not copy-pasted across them. Each one follows the brand voice, tone, and content rules stored in your knowledge base.",
  },
  {
    step: "Risk-tier",
    detail:
      "Every draft is classified 🟢 Auto, 🟡 Approval, or 🔴 Never before you ever see it — based on keyword rules and AI judgment on sensitivity.",
  },
  {
    step: "Approve",
    detail:
      "Low-risk drafts can publish on their own. Everything else sits in a queue until you approve, edit, or reject it — a 10-second decision, not a rewrite.",
  },
  {
    step: "Publish",
    detail:
      "Approved content goes out to the right platform — X, Threads, or LinkedIn — through each platform's own publishing path, respecting its character limits and format.",
  },
];

export default function AiMarketingAgentPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">AI marketing agent</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          What is an AI marketing agent?
        </h1>
        <p className="mt-6 text-lg text-neutral-600">
          An AI marketing agent doesn't just generate text on request — it runs the whole loop from
          "what's worth saying" to "it's live," and hands you the decision points that actually matter
          instead of every keystroke. Orbit AI is built specifically for social media marketing across
          X, Threads, and LinkedIn (with Instagram support coming soon), for businesses that don't have
          the time to write, schedule, and publish every post by hand.
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
          <h2 className="text-2xl font-semibold tracking-tight">What makes it an agent, not a tool</h2>
          <div className="mt-10 space-y-8">
            {NOT_A.map((item) => (
              <div key={item.title}>
                <h3 className="font-medium">{item.title}</h3>
                <p className="mt-1 text-neutral-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">How Orbit AI's workflow works</h2>
          <ol className="mt-10 space-y-8">
            {WORKFLOW.map((item, i) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-medium text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-medium">{item.step}</h3>
                  <p className="mt-1 text-neutral-600">{item.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Built per platform, not copy-pasted</h2>
          <p className="mt-4 text-neutral-600">
            X, Threads, and LinkedIn don't work the same way — character limits, tone, and what counts
            as a good post all differ. See how Orbit AI handles each one:
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Link href="/x-marketing" className="rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-400">
              <p className="font-medium">X</p>
              <p className="mt-1 text-sm text-neutral-600">280-character posts and reply drafts.</p>
            </Link>
            <Link href="/threads-marketing" className="rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-400">
              <p className="font-medium">Threads</p>
              <p className="mt-1 text-sm text-neutral-600">Longer-form, conversational posting.</p>
            </Link>
            <Link href="/linkedin-marketing" className="rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-400">
              <p className="font-medium">LinkedIn</p>
              <p className="mt-1 text-sm text-neutral-600">Company Page posts for B2B distribution.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            See it draft your first post.
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
