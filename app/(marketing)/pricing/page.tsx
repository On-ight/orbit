import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth/current-user";
import { PLAN_PRICING, type PlanTier } from "@/lib/billing/pricing";
import { PLAN_LIMITS } from "@/lib/billing/plan-limits";
import { resolveBillingCurrency } from "@/lib/billing/geo";
import { SubscribeButton } from "@/components/billing/SubscribeButton";
import { ActivateFreeButton } from "@/components/billing/ActivateFreeButton";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Orbit AI plans for solo founders, growing startups, and agencies — start free, upgrade when you need more.",
};

function generationsLine(tier: PlanTier): string {
  const limit = PLAN_LIMITS[tier].aiGenerationsPerMonth;
  return limit === null ? "Unlimited AI generations (fair use)" : `${limit} AI-generated posts & drafts / month`;
}

function reelsLine(tier: PlanTier): string {
  const limit = PLAN_LIMITS[tier].reelsPerMonth;
  return limit === 0 ? "No AI Reels" : `${limit} AI Reels / month`;
}

function carouselsLine(tier: PlanTier): string {
  const limit = PLAN_LIMITS[tier].carouselsPerMonth;
  return `${limit} AI Carousels / month`;
}

// Numbers sourced from PLAN_LIMITS (the same values start/route.ts and
// app/api/approvals/[id]/route.ts actually enforce) rather than hardcoded,
// so this copy can't silently drift out of sync with what's enforced.
function connectedAccountsLine(tier: PlanTier): string {
  return `${PLAN_LIMITS[tier].maxConnectedAccounts} connected social accounts`;
}

function publishedPostsLine(tier: PlanTier): string {
  const limit = PLAN_LIMITS[tier].publishedPostsPerMonth;
  return limit === null ? "Unlimited published posts" : `Up to ${limit.toLocaleString()} published posts/month`;
}

const TIERS: { tier: PlanTier; name: string; audience: string; features: string[]; mostPopular?: boolean }[] = [
  {
    tier: "FREE",
    name: "Free",
    audience: "4-day free trial",
    features: [
      "Full access for 4 days, then choose a paid plan to continue",
      "Threads posts + Instagram Carousels — upgrade for X and LinkedIn",
      connectedAccountsLine("FREE"),
      publishedPostsLine("FREE"),
      generationsLine("FREE"),
      "Full approval queue — Auto / Approval / Never",
      "Manual publishing — you approve and publish every post",
      reelsLine("FREE"),
      carouselsLine("FREE"),
      "No credit card required",
    ],
  },
  {
    tier: "BUILDER",
    name: "Starter",
    audience: "For founders who want to stay consistent without spending time publishing manually.",
    features: [
      connectedAccountsLine("BUILDER"),
      publishedPostsLine("BUILDER"),
      "AI text and caption generation",
      "Content calendar and scheduling",
      "Basic brand voice settings",
      "One workspace",
      "No included HeyGen video generation",
    ],
  },
  {
    tier: "GROWTH",
    name: "Growth",
    audience: "For founders who want Orbit to manage their daily publishing workflow.",
    mostPopular: true,
    features: [
      connectedAccountsLine("GROWTH"),
      publishedPostsLine("GROWTH"),
      "AI content generation and repurposing",
      "Scheduling and publishing automation",
      "Brand voice and reusable content formats",
      "One workspace",
      "Basic publishing activity and performance tracking",
      "Video generation available as a paid add-on",
    ],
  },
  {
    tier: "PRO",
    name: "Pro",
    audience: "For founders and small marketing teams managing several brands or higher publishing volumes.",
    features: [
      connectedAccountsLine("PRO"),
      publishedPostsLine("PRO"),
      "Everything in Growth",
      "Multiple workspaces or brands",
      "Team collaboration and approval workflows",
      "Advanced scheduling controls",
      "More detailed performance reporting",
      "Optional video-generation credits",
    ],
  },
  {
    tier: "AGENCY",
    name: "Agency",
    audience: "For agencies managing content and publishing for multiple clients.",
    features: [
      connectedAccountsLine("AGENCY"),
      publishedPostsLine("AGENCY"),
      "Multiple client workspaces",
      "Team roles and approval workflows",
      "Client-specific brand voice settings",
      "Consolidated publishing overview",
      "Higher usage limits and priority support",
      "Video credits purchased separately",
    ],
  },
];

export default async function PricingPage() {
  const [currentUser, headerList] = await Promise.all([getCurrentUser(), headers()]);
  const billingCurrency = resolveBillingCurrency(headerList);
  const pricingForCurrency = PLAN_PRICING[billingCurrency];

  return (
    <>
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          Plans that grow with you
        </h1>
        <p className="mt-6 text-lg text-neutral-600">
          {currentUser
            ? "Pick a plan to activate your workspace."
            : "Start with a 4-day free trial, see what Orbit AI drafts for your brand, and go from there."}
        </p>
        {currentUser?.account.subscriptionStatus === "trial_expired" && (
          <p className="mx-auto mt-4 max-w-md rounded-md bg-[var(--status-warning-soft)] px-4 py-2 text-sm text-[var(--status-warning)]">
            Your 4-day free trial has ended — pick a plan below to keep using Orbit.
          </p>
        )}
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-xl border bg-white p-6 ${
                  tier.mostPopular ? "border-neutral-900 shadow-sm" : "border-neutral-200"
                }`}
              >
                {tier.mostPopular && (
                  <span className="absolute -top-3 left-6 rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white">
                    Most popular
                  </span>
                )}
                <p className="text-lg font-semibold">{tier.name}</p>
                <p className="mt-1 text-sm text-neutral-500">{tier.audience}</p>
                <p className="mt-4 text-2xl font-semibold">{pricingForCurrency[tier.tier].label}</p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-neutral-600">
                      <span className="mt-0.5 text-neutral-400">—</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {currentUser ? (
                    tier.tier === "FREE" ? (
                      currentUser.account.trialEndsAt !== null ? (
                        <p className="rounded-md border border-neutral-200 px-4 py-2 text-center text-sm text-neutral-400">
                          {currentUser.account.planTier === "FREE" && currentUser.account.subscriptionStatus === "active"
                            ? "Current plan"
                            : "Trial already used"}
                        </p>
                      ) : (
                        <ActivateFreeButton />
                      )
                    ) : (
                      <SubscribeButton planTier={tier.tier} accountName={currentUser.account.name} />
                    )
                  ) : (
                    <Link
                      href="/signup"
                      className="block rounded-md bg-neutral-900 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-neutral-700"
                    >
                      {tier.tier === "FREE" ? "Start for free" : "Start free"}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          {!currentUser && (
            <p className="mt-10 text-center text-sm text-neutral-500">
              Create your free Orbit account — Free activates instantly for 4 days, no payment info needed.
              Upgrade to a paid plan any time from Settings, or after your trial ends.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
