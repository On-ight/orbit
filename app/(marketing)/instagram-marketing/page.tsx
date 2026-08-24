import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Instagram Marketing Tool (Coming Soon)",
  description:
    "Orbit AI is building an AI agent for Instagram marketing — content drafting and caption generation for Instagram, coming soon. Available today: X, Threads, and LinkedIn.",
};

export default function InstagramMarketingPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 py-20">
        <span className="inline-block rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
          Coming soon
        </span>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          An AI agent for Instagram marketing
        </h1>
        <p className="mt-6 text-lg text-neutral-600">
          Instagram support is on the Orbit AI roadmap — the same research-draft-approve-publish workflow
          that already runs on X, Threads, and LinkedIn, extended to Instagram captions and content
          planning. It isn't live yet, so we won't claim otherwise here — but it's coming, and
          signing up today means you're already set up on the platforms Orbit AI does support the moment
          it ships.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Start free on X, Threads &amp; LinkedIn
          </Link>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">What's live right now</h2>
          <p className="mt-4 text-neutral-600">
            Orbit AI already runs the full research-draft-approve-publish loop on three platforms:
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
    </>
  );
}
