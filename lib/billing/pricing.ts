import type { BillingCurrency } from "./geo";

export const PLAN_TIERS = ["FREE", "BUILDER", "GROWTH", "AGENCY"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

interface TierPricing {
  amountMinorUnits: number;
  currency: string;
  label: string;
}

// USD tiers — international track, confirmed pricing.
const USD_PRICING: Record<PlanTier, TierPricing> = {
  FREE: { amountMinorUnits: 0, currency: "USD", label: "Free" },
  BUILDER: { amountMinorUnits: 900, currency: "USD", label: "$9/month" },
  GROWTH: { amountMinorUnits: 2_900, currency: "USD", label: "$29/month" },
  AGENCY: { amountMinorUnits: 9_900, currency: "USD", label: "$99/month" },
};

// INR tiers — direct conversion from the USD tiers at ~87 INR/USD, rounded
// to the nearest rupee. Not an independently-set domestic price; it moves
// if the USD tiers change or the exchange rate drifts, so revisit this
// periodically rather than treating it as fixed.
const INR_PRICING: Record<PlanTier, TierPricing> = {
  FREE: { amountMinorUnits: 0, currency: "INR", label: "Free" },
  BUILDER: { amountMinorUnits: 78_300, currency: "INR", label: "₹783/month" },
  GROWTH: { amountMinorUnits: 252_300, currency: "INR", label: "₹2,523/month" },
  AGENCY: { amountMinorUnits: 861_300, currency: "INR", label: "₹8,613/month" },
};

export const PLAN_PRICING: Record<BillingCurrency, Record<PlanTier, TierPricing>> = {
  USD: USD_PRICING,
  INR: INR_PRICING,
};

export function isPlanTier(value: unknown): value is PlanTier {
  return typeof value === "string" && (PLAN_TIERS as readonly string[]).includes(value);
}
