import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Orbit AI started as an internal tool for staying visible on social media while building a product — now it's available for any business that doesn't have time to write every post by hand.",
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">About Orbit AI</h1>
      <div className="mt-8 space-y-6 text-lg text-neutral-600">
        <p>We built Orbit because we had a problem.</p>
        <p>We were building a product.</p>
        <p>Marketing kept getting pushed to tomorrow.</p>
        <p>Tomorrow became next week.</p>
        <p>Next week became: &quot;We haven&apos;t posted in three weeks.&quot;</p>
        <p>So we built the thing we wanted ourselves.</p>
        <p>
          The obvious fix was a fully autonomous bot that posts on its own. We didn&apos;t trust that with
          our own brand, and we didn&apos;t expect anyone else to trust it with theirs either. So Orbit AI
          got built around a different idea: research and draft everything automatically, but keep a
          human in the loop wherever the stakes are actually high. Routine, on-brand posts can go out on
          their own. Anything ambiguous waits for a yes. Anything sensitive never publishes without a
          person — full stop.
        </p>
        <p>
          That approval-queue-first design is still the core of how Orbit AI works today, now available
          for any business — founders, indie hackers, agencies, and creators — who need consistent social
          media marketing without hiring for it or losing control of what goes out under their name.
        </p>
      </div>
    </section>
  );
}
