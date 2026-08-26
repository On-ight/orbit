import type { BillingCurrency } from "./geo";

export const PLAN_TIERS = ["STARTER", "GROWTH", "AGENCY"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

interface TierPricing {
  amountMinorUnits: number;
  currency: string;
  label: string;
}

// USD tiers — international track, confirmed pricing.
const USD_PRICING: Record<PlanTier, TierPricing> = {
  STARTER: { amountMinorUnits: 4_990, currency: "USD", label: "$49.90/month" },
  GROWTH: { amountMinorUnits: 9_990, currency: "USD", label: "$99.90/month" },
  AGENCY: { amountMinorUnits: 15_990, currency: "USD", label: "$159.90/month" },
};

// INR tiers — direct conversion from the USD tiers at ~87 INR/USD, rounded
// to the nearest rupee. Not an independently-set domestic price; it moves
// if the USD tiers change or the exchange rate drifts, so revisit this
// periodically rather than treating it as fixed.
const INR_PRICING: Record<PlanTier, TierPricing> = {
  STARTER: { amountMinorUnits: 434_100, currency: "INR", label: "₹4,341/month" },
  GROWTH: { amountMinorUnits: 869_100, currency: "INR", label: "₹8,691/month" },
  AGENCY: { amountMinorUnits: 1_391_100, currency: "INR", label: "₹13,911/month" },
};

export const PLAN_PRICING: Record<BillingCurrency, Record<PlanTier, TierPricing>> = {
  USD: USD_PRICING,
  INR: INR_PRICING,
};

export function isPlanTier(value: unknown): value is PlanTier {
  return typeof value === "string" && (PLAN_TIERS as readonly string[]).includes(value);
}
