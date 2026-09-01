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

const TIERS: { tier: PlanTier; name: string; audience: string; features: string[]; mostPopular?: boolean }[] = [
  {
    tier: "FREE",
    name: "Free",
    audience: "For trying Orbit out",
    features: [
      "1 X account connected",
      generationsLine("FREE"),
      "Full approval queue — Auto / Approval / Never",
      "Manual publishing — you approve and publish every post",
      "No credit card required",
    ],
  },
  {
    tier: "BUILDER",
    name: "Builder",
    audience: "For solo founders",
    features: [
      "Everything in Free",
      generationsLine("BUILDER"),
      "Live trend research — real web search, not templates",
      "Auto-publish for low-risk (Auto-tier) content",
      "Reply drafting for mentions",
    ],
  },
  {
    tier: "GROWTH",
    name: "Growth",
    audience: "For growing startups",
    mostPopular: true,
    features: [
      "Everything in Builder",
      generationsLine("GROWTH"),
      "Priority support",
    ],
  },
  {
    tier: "AGENCY",
    name: "Agency",
    audience: "For agencies and teams",
    features: [
      "Everything in Growth",
      generationsLine("AGENCY"),
      "Dedicated priority support & onboarding help",
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
            : "Start free, see what Orbit AI drafts for your brand, and go from there."}
        </p>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 md:grid-cols-4">
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
                      <ActivateFreeButton />
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
              Create your free Orbit account — Free activates instantly, no payment info needed. Upgrade to a
              paid plan any time from Settings.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
