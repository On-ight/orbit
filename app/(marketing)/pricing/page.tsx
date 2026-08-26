import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/current-user";
import { PLAN_PRICING, type PlanTier } from "@/lib/billing/pricing";
import { SubscribeButton } from "@/components/billing/SubscribeButton";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Orbit AI plans for solo founders, growing teams, and agencies managing multiple client accounts across X, Threads, and LinkedIn.",
};

const TIERS: { tier: PlanTier; name: string; audience: string; features: string[] }[] = [
  {
    tier: "STARTER",
    name: "Starter",
    audience: "Solo founders and indie hackers",
    features: [
      "One workspace, one team member",
      "X, Threads, and LinkedIn drafting",
      "Daily automated trend research",
      "Full approval queue with risk tiers",
    ],
  },
  {
    tier: "GROWTH",
    name: "Growth",
    audience: "Small teams and growing startups",
    features: [
      "Everything in Starter",
      "Multiple team members on one workspace",
      "Custom brand voice and content pillar rules",
      "Priority support",
    ],
  },
  {
    tier: "AGENCY",
    name: "Agency",
    audience: "Agencies managing multiple client accounts",
    features: [
      "Everything in Growth",
      "Multiple client workspaces from one login",
      "Per-client brand voice and approval queues",
      "Volume-based account pricing",
    ],
  },
];

export default async function PricingPage() {
  const currentUser = await getCurrentUser();

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
          <div className="grid gap-6 md:grid-cols-3">
            {TIERS.map((tier) => (
              <div key={tier.name} className="rounded-xl border border-neutral-200 bg-white p-6">
                <p className="text-lg font-semibold">{tier.name}</p>
                <p className="mt-1 text-sm text-neutral-500">{tier.audience}</p>
                <p className="mt-4 text-2xl font-semibold">{PLAN_PRICING[tier.tier].label}</p>
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
                    <SubscribeButton planTier={tier.tier} accountName={currentUser.account.name} />
                  ) : (
                    <Link
                      href="/signup"
                      className="block rounded-md bg-neutral-900 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-neutral-700"
                    >
                      Start free
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          {!currentUser && (
            <p className="mt-10 text-center text-sm text-neutral-500">
              Sign up first, then come back here to activate a plan.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
