import Link from "next/link";

const SEGMENTS = [
  {
    tag: "SaaS founders",
    line: "Stop disappearing while you're busy building.",
    detail:
      "Ship a feature, fix a bug, close a customer — Orbit AI turns it into a post the same day, drafted and queued for a 10-second approval.",
  },
  {
    tag: "Indie hackers",
    line: "Turn building updates into daily distribution.",
    detail:
      "You're already doing the work. Orbit AI watches for what's worth sharing and keeps your build-in-public feed alive without it becoming a second job.",
  },
  {
    tag: "Agencies",
    line: "Manage consistent multi-platform content without adding another content employee.",
    detail:
      "One dashboard, one approval queue, every client account — X, Threads, and LinkedIn drafted on-brand, per account, without hiring for it.",
  },
  {
    tag: "Creators",
    line: "Keep your voice, automate the consistency.",
    detail:
      "Feed Orbit AI your voice and your rules once. It drafts in that voice every day — you're still the one who hits approve.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "It finds what's worth posting",
    detail:
      "Orbit AI researches trends and conversations relevant to your product — not generic filler, tuned to what you actually do.",
  },
  {
    number: "02",
    title: "It drafts in your voice",
    detail:
      "Every draft follows the brand voice, tone, and safety rules you set once — not a generic AI voice, yours.",
  },
  {
    number: "03",
    title: "You approve, it publishes",
    detail:
      "Low-risk drafts can go out automatically. Everything else waits in a queue for a yes or a no — across X, Threads, and LinkedIn.",
  },
];

const PLATFORMS = [
  { href: "/x-marketing", label: "X", detail: "Threads, replies, and daily posting cadence." },
  { href: "/threads-marketing", label: "Threads", detail: "Build-in-public recaps and conversation replies." },
  { href: "/linkedin-marketing", label: "LinkedIn", detail: "Company Page posting for B2B distribution." },
  { href: "/instagram-marketing", label: "Instagram", detail: "Coming soon.", comingSoon: true },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Orbit AI",
      alternateName: "OrbitAI",
      url: "https://orbitai.co.in",
      logo: "https://orbitai.co.in/orbit-logo.png",
      description:
        "Orbit AI is an autonomous AI marketing agent that helps businesses plan, create, and manage social media marketing across X, Threads, and LinkedIn.",
    },
    {
      "@type": "SoftwareApplication",
      name: "Orbit AI",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Orbit AI plans, drafts, and helps publish social media marketing content across X, Threads, and LinkedIn — with a human approval queue and risk-based autonomy.",
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid items-center gap-14 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">
              AI marketing agent
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Your AI Marketing Agent for X, Threads &amp; LinkedIn
            </h1>
            <p className="mt-5 max-w-md text-lg text-neutral-600">
              Orbit AI helps businesses plan, create, schedule, publish, and optimize social media
              marketing across X, Threads, and LinkedIn — from one AI-powered workspace.
              Instagram support is coming soon.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/signup"
                className="rounded-md bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
              >
                Start free
              </Link>
              <Link href="/login" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
                Already have an account? Sign in →
              </Link>
            </div>
          </div>

          {/* Approval queue mock */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Approval queue
            </p>
            <div className="space-y-3">
              {[
                {
                  platform: "X",
                  text: "Shipped scheduled publishing today — drafts now queue themselves while you sleep.",
                  tier: "🟢 Auto",
                },
                {
                  platform: "LinkedIn",
                  text: "Reply to a prospect asking about our pricing tiers and what's included.",
                  tier: "🟡 Approval",
                },
                {
                  platform: "Threads",
                  text: "Weekly build-in-public recap, drafted from this week's commits.",
                  tier: "🟢 Auto",
                },
              ].map((item) => (
                <div key={item.text} className="rounded-lg border border-neutral-200 bg-white p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500">{item.platform}</span>
                    <span className="text-xs text-neutral-500">{item.tier}</span>
                  </div>
                  <p className="text-sm text-neutral-800">{item.text}</p>
                  <div className="mt-2 flex gap-2">
                    <span className="rounded bg-neutral-900 px-2 py-1 text-xs font-medium text-white">
                      Approve
                    </span>
                    <span className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-600">
                      Edit
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What it does */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">What Orbit AI actually does</h2>
          <p className="mt-3 max-w-2xl text-neutral-600">
            Not a scheduler. Not a generic AI writer. Orbit AI is the loop from "what's worth saying" to
            "it's live" — with you deciding how much of that loop it can run on its own.
          </p>

          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number}>
                <span className="text-sm font-semibold text-neutral-400">{step.number}</span>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="border-t border-neutral-200">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">One agent, every platform</h2>
          <p className="mt-3 max-w-2xl text-neutral-600">
            Each platform has its own workflow, character limits, and posting norms — Orbit AI adapts to
            each one instead of pasting the same text everywhere.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {PLATFORMS.map((platform) => (
              <Link
                key={platform.href}
                href={platform.href}
                className="rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-400"
              >
                <p className="font-medium">{platform.label}</p>
                <p className="mt-1 text-sm text-neutral-600">{platform.detail}</p>
                {platform.comingSoon && (
                  <span className="mt-2 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                    Coming soon
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Control / risk tiers */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                You decide how much runs on its own.
              </h2>
              <p className="mt-4 text-neutral-600">
                Every draft is tagged by risk before you ever see it. Routine, on-brand posts can
                publish automatically. Anything ambiguous waits for your yes. Anything sensitive
                never publishes without a human — full stop.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4">
                <span className="text-xl">🟢</span>
                <div>
                  <p className="font-medium">Auto</p>
                  <p className="text-sm text-neutral-600">Low-risk, on-brand — publishes without waiting on you.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4">
                <span className="text-xl">🟡</span>
                <div>
                  <p className="font-medium">Approval</p>
                  <p className="text-sm text-neutral-600">Drafted and queued — you give it a yes or a no.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4">
                <span className="text-xl">🔴</span>
                <div>
                  <p className="font-medium">Never</p>
                  <p className="text-sm text-neutral-600">Flagged for a human to handle — Orbit AI won't touch it.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Segments */}
      <section className="border-t border-neutral-200">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Built for people already stretched thin</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {SEGMENTS.map((segment) => (
              <div key={segment.tag} className="rounded-xl border border-neutral-200 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {segment.tag}
                </p>
                <p className="mt-2 text-lg font-medium leading-snug">{segment.line}</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{segment.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Stop disappearing while you're busy building.
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
