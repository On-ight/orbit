import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI LinkedIn Marketing Tool",
  description:
    "Orbit AI is an AI agent for LinkedIn marketing — it drafts Company Page posts for B2B distribution, with an approval queue and optional image attachments, so nothing goes out unreviewed.",
};

export default function LinkedInMarketingPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">LinkedIn marketing</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          An AI agent for LinkedIn marketing
        </h1>
        <p className="mt-6 text-lg text-neutral-600">
          LinkedIn is where B2B buyers actually pay attention — but it's also the platform where a
          careless post costs you the most credibility. Orbit AI drafts Company Page posts built for
          that audience, and nothing reaches LinkedIn without going through your approval queue first.
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
          <h2 className="text-2xl font-semibold tracking-tight">How Orbit AI handles LinkedIn specifically</h2>
          <div className="mt-10 space-y-8">
            <div>
              <h3 className="font-medium">Company Page, not personal profile</h3>
              <p className="mt-1 text-neutral-600">
                Orbit AI publishes to your business's Company Page — building the brand's presence, not
                a founder's personal feed.
              </p>
            </div>
            <div>
              <h3 className="font-medium">B2B tone, not a shorter X post</h3>
              <p className="mt-1 text-neutral-600">
                LinkedIn rewards a more professional, context-rich register than X or Threads. Orbit AI
                drafts accordingly, using LinkedIn's higher character limit instead of cutting the same
                short-form copy down to fit.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Images, when they matter</h3>
              <p className="mt-1 text-neutral-600">
                You can attach an image to a LinkedIn draft while reviewing it in the approval queue —
                Orbit AI never generates or picks images on its own for this platform, you always decide.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Every post is reviewed by default</h3>
              <p className="mt-1 text-neutral-600">
                Given how much a LinkedIn post can carry for a B2B brand, LinkedIn drafts default to the
                🟡 Approval tier rather than auto-publishing — you're always the last check.
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
            <Link href="/threads-marketing" className="rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-400">
              <p className="font-medium">Threads</p>
              <p className="mt-1 text-sm text-neutral-600">Longer-form, conversational posting.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Let Orbit AI draft your next LinkedIn post.
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
