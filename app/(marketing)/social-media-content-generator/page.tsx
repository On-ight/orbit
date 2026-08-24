import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Social Media Content Generator",
  description:
    "Orbit AI generates on-brand social media content for X, Threads, and LinkedIn — grounded in your brand voice and current trends, not generic AI copy.",
};

export default function ContentGeneratorPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">
          AI content generator
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          An AI content generator that already knows your brand
        </h1>
        <p className="mt-6 text-lg text-neutral-600">
          Most AI content generators start from a blank prompt every time, which is why the output
          reads generic. Orbit AI stores your brand voice, content pillars, and safety rules once, then
          generates every draft against that — for X, Threads, and LinkedIn, in each platform's own
          format.
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
          <h2 className="text-2xl font-semibold tracking-tight">What makes the content on-brand</h2>
          <div className="mt-10 space-y-8">
            <div>
              <h3 className="font-medium">A knowledge base you set once</h3>
              <p className="mt-1 text-neutral-600">
                Brand voice, content pillars, product details, and what to never say — stored once and
                pulled into every generated draft, instead of re-explaining your brand in every prompt.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Grounded in current trends, not stock prompts</h3>
              <p className="mt-1 text-neutral-600">
                Orbit AI researches what's actually being discussed in your space before generating
                content — so drafts respond to something real, not a generic content-calendar template.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Adapted per platform, not duplicated</h3>
              <p className="mt-1 text-neutral-600">
                A single idea becomes a 280-character X post, a longer conversational Threads post, and
                a professional LinkedIn update — each written for that platform, not the same text
                pasted three times.
              </p>
            </div>
            <div>
              <h3 className="font-medium">You still approve it</h3>
              <p className="mt-1 text-neutral-600">
                Generated content lands in a queue, tagged by risk. You edit or approve before anything
                goes out — the generator doesn't publish on your behalf without a check.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Generate your first on-brand draft.
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
