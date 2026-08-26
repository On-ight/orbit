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

// PLACEHOLDER — INR tiers for the domestic track. NOT confirmed real
// pricing (carried over from an earlier guess purely so this track has
// something non-zero to test end-to-end against). Replace with real
// amounts before any Indian visitor can actually reach checkout.
const INR_PRICING: Record<PlanTier, TierPricing> = {
  STARTER: { amountMinorUnits: 99_900, currency: "INR", label: "₹999/month" },
  GROWTH: { amountMinorUnits: 299_900, currency: "INR", label: "₹2,999/month" },
  AGENCY: { amountMinorUnits: 799_900, currency: "INR", label: "₹7,999/month" },
};

export const PLAN_PRICING: Record<BillingCurrency, Record<PlanTier, TierPricing>> = {
  USD: USD_PRICING,
  INR: INR_PRICING,
};

export function isPlanTier(value: unknown): value is PlanTier {
  return typeof value === "string" && (PLAN_TIERS as readonly string[]).includes(value);
}
