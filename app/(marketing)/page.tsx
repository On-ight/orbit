import Link from "next/link";
import { ApprovalQueueDemo } from "@/components/marketing/ApprovalQueueDemo";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { OrbitMascot } from "@/components/marketing/OrbitMascot";

function HeroCard({
  className,
  delay,
  tag,
  text,
  action,
}: {
  className: string;
  delay: string;
  tag: string;
  text: string;
  action?: boolean;
}) {
  return (
    <div className={`pointer-events-none absolute z-10 hidden w-60 [perspective:800px] lg:block ${className}`}>
      <div
        className="animate-[hero-float_6s_ease-in-out_infinite] rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_24px_50px_-20px_rgba(98,41,206,0.45),inset_0_1px_0_white] backdrop-blur-md [transform:rotateY(var(--tilt))_rotateX(6deg)]"
        style={{ animationDelay: delay }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{tag}</p>
        <p className="mt-1.5 text-sm leading-snug text-neutral-800">{text}</p>
        {action && (
          <div className="mt-3 flex gap-2">
            <span className="rounded-md bg-[#8e42fc] px-2.5 py-1 text-xs font-medium text-white">Approve</span>
            <span className="rounded-md bg-[#f1ecfa] px-2.5 py-1 text-xs font-medium text-[#6229ce]">Edit</span>
          </div>
        )}
      </div>
    </div>
  );
}

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

const HOW_IT_WORKS = [
  {
    title: "Research",
    detail: "Finds product moments, trends, and conversations worth joining — scoped to your brand, not generic filler.",
  },
  {
    title: "Create",
    detail: "Drafts in your voice, adapted per platform — X, Threads, and LinkedIn each get their own version, not one post pasted three times.",
  },
  {
    title: "Publish",
    detail: "Low-risk drafts can go out automatically. Everything else waits for your yes — you're always the last step for anything that matters.",
  },
];

const EXAMPLE_DRAFTS = [
  {
    platform: "X",
    text: "We just rebuilt onboarding from scratch. New users now see their first result in under 2 minutes, down from ~15. Small change, huge difference in who sticks around.",
  },
  {
    platform: "Threads",
    text: "Here's what we learned rebuilding onboarding: most people weren't dropping off because the product was confusing — they were dropping off because we asked for too much before showing any value. Fixed that this week.",
  },
  {
    platform: "LinkedIn",
    text: "We redesigned our onboarding flow this quarter. The old version asked new users to configure five things before they saw any value — the new one shows a working result first, and lets them customize after. Time-to-first-value dropped from ~15 minutes to under 2.",
  },
  {
    platform: "Instagram",
    text: "Carousel: “5 reasons onboarding flows lose users” — slide 1 opens with the old 15-minute setup, slide 5 closes with the new under-2-minute one. AI-avatar Reels get the same treatment.",
  },
];

const PLATFORMS = [
  { href: "/x-marketing", label: "X", detail: "Threads, replies, and daily posting cadence." },
  { href: "/threads-marketing", label: "Threads", detail: "Build-in-public recaps and conversation replies." },
  { href: "/linkedin-marketing", label: "LinkedIn", detail: "Company Page posting for B2B distribution." },
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

      {/* Opening screen — just Orbit, filling the first view */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,#f1e8ff_0%,#ffffff_60%)]">
        {/* Perspective grid floor — gives the mascot something to stand on */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[-50%] bottom-0 h-[45%] origin-bottom [transform:perspective(600px)_rotateX(62deg)] bg-[linear-gradient(to_right,rgba(142,66,252,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(142,66,252,0.18)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_top,black_10%,transparent_85%)]"
        />

        <div className="relative mx-auto flex min-h-[calc(100svh-77px)] max-w-6xl flex-col justify-center px-6">
          <div className="relative">
            <OrbitMascot className="h-[min(72svh,680px)]" />

            {/* Floating drafts around Orbit — illustrative, mirrors the approval queue below */}
            <HeroCard
              className="left-0 top-10 [--tilt:18deg]"
              delay="0s"
              tag="🟢 Auto · X"
              text="Shipped onboarding v2 — drafted & scheduled."
            />
            <HeroCard
              className="right-0 top-24 [--tilt:-18deg]"
              delay="1.2s"
              tag="🟡 Needs your yes · LinkedIn"
              text="What we learned rebuilding onboarding this quarter…"
              action
            />
            <HeroCard
              className="bottom-16 left-6 [--tilt:14deg]"
              delay="2.4s"
              tag="Threads · queued"
              text="Friday build-in-public recap is ready."
            />
          </div>

          <a
            href="#intro"
            className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-xs font-medium uppercase tracking-widest text-[#6229ce]/70 transition hover:text-[#6229ce]"
          >
            Scroll
            <span className="animate-bounce text-base">↓</span>
          </a>
        </div>
      </section>

      {/* Hero */}
      <section id="intro" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid items-center gap-14 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">AI marketing agent</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              We don&apos;t ship features. We ship consistency.
            </h1>
            <p className="mt-5 max-w-md text-lg text-neutral-600">
              Most marketing tools chase more dashboards, more analytics, more features. Orbit just
              keeps showing up — drafting and publishing across X, Threads, LinkedIn &amp; Instagram
              every day, getting sharper as your content and product evolve.
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
            <p className="mt-3 text-xs text-neutral-500">No credit card required.</p>
          </div>

          <ApprovalQueueDemo />
        </div>

        <div className="mt-20">
          <p className="mb-6 text-center text-sm font-medium uppercase tracking-widest text-neutral-500">
            The actual dashboard
          </p>
          <DashboardPreview />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-neutral-200">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Stop treating marketing like another job.
          </h2>
          <p className="mt-3 max-w-2xl text-neutral-600">
            You build the product. Orbit handles the repetitive distribution work around it.
          </p>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title}>
                <span className="text-sm font-semibold text-neutral-400">0{i + 1}</span>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* One idea, three platforms */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">One idea. Four platforms.</h2>
          <p className="mt-3 max-w-2xl text-neutral-600">
            The same update, adapted to how each platform actually gets read — not one post pasted four
            times. Illustrative example below.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {EXAMPLE_DRAFTS.map((draft) => (
              <div key={draft.platform} className="rounded-xl border border-neutral-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{draft.platform}</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">{draft.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Control / risk tiers */}
      <section className="border-t border-neutral-200">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                You decide how autonomous Orbit is.
              </h2>
              <p className="mt-4 text-neutral-600">
                What each risk tier actually covers — not configurable, this is the safety policy every
                account runs under.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4">
                <span className="text-xl">🟢</span>
                <div>
                  <p className="font-medium">Auto — the AI just does it</p>
                  <p className="text-sm text-neutral-600">
                    Trend collection, analysis, categorization, and drafting for low-risk, on-brand posts.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4">
                <span className="text-xl">🟡</span>
                <div>
                  <p className="font-medium">Approval — the AI asks you</p>
                  <p className="text-sm text-neutral-600">
                    Posts, replies, and sensitive conversations — drafted, but a human approves before anything publishes.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4">
                <span className="text-xl">🔴</span>
                <div>
                  <p className="font-medium">Never autonomous — always flagged for you</p>
                  <p className="text-sm text-neutral-600">
                    Political topics, complaints, accusations, unverified claims — Orbit won&apos;t draft usable content at all.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">One agent, every platform</h2>
          <p className="mt-3 max-w-2xl text-neutral-600">
            Currently supporting X, Threads &amp; LinkedIn — each with its own workflow, character limits, and
            posting norms.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {PLATFORMS.map((platform) => (
              <Link
                key={platform.href}
                href={platform.href}
                className="rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-400"
              >
                <p className="font-medium">{platform.label}</p>
                <p className="mt-1 text-sm text-neutral-600">{platform.detail}</p>
              </Link>
            ))}
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

      {/* Trust — honest, one real testimonial, no invented numbers */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Built for people who care about what gets posted.
          </h2>
          <p className="mt-4 text-neutral-600">
            Orbit is early. We&apos;d rather show you exactly how the approval queue works than promise
            numbers we can&apos;t back up yet — nothing publishes on your behalf without going through the
            same Auto / Approval / Never policy above, every time.
          </p>

          <figure className="mx-auto mt-10 max-w-lg rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element -- small static logo, not worth next/image's overhead here */}
            <img src="/onsight_logo.jpeg" alt="OnSight" width={117} height={32} className="mx-auto h-8 w-auto" />
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Travel technology · India
            </p>
            <blockquote className="mt-6 text-base leading-relaxed text-neutral-700">
              &quot;We&apos;re building OnSight, so marketing often ends up being the thing we postpone. Orbit
              helps us turn what we&apos;re already building into content and stay consistent without making
              social media another full-time job.&quot;
            </blockquote>
            <figcaption className="mt-6">
              <p className="text-sm font-semibold text-neutral-900">Shalini Sharma</p>
              <p className="text-xs text-neutral-500">CTO, OnSight</p>
              <a
                href="https://onsight.co.in"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs text-neutral-500 hover:text-neutral-900 hover:underline"
              >
                onsight.co.in
              </a>
            </figcaption>
          </figure>

          <Link href="/about" className="mt-6 inline-block text-sm font-medium text-neutral-900 hover:underline">
            Read why we built it this way →
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-neutral-200">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Your product is already doing the work. Orbit makes sure people hear about it.
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
