import type { BillingCurrency } from "./geo";

// "BUILDER" and "AGENCY" are internal/DB identifiers only — kept unchanged
// so existing paying customers' stored Account.planTier value keeps
// resolving correctly (renaming the string itself would silently downgrade
// them to FREE via limitsForTier's fallback, since the old string would no
// longer match any PlanTier). Their user-facing display name is now
// "Starter" and "Agency" is unchanged — see the `label`/name fields
// wherever each tier is actually shown (pricing page, Settings).
export const PLAN_TIERS = ["FREE", "BUILDER", "GROWTH", "PRO", "AGENCY"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

interface TierPricing {
  amountMinorUnits: number;
  currency: string;
  label: string;
}

// USD tiers — international track, confirmed pricing.
const USD_PRICING: Record<PlanTier, TierPricing> = {
  FREE: { amountMinorUnits: 0, currency: "USD", label: "Free" },
  BUILDER: { amountMinorUnits: 1_800, currency: "USD", label: "$18/month" },
  GROWTH: { amountMinorUnits: 2_900, currency: "USD", label: "$29/month" },
  PRO: { amountMinorUnits: 8_900, currency: "USD", label: "$89/month" },
  AGENCY: { amountMinorUnits: 16_900, currency: "USD", label: "$169/month" },
};

// INR tiers — direct conversion from the USD tiers at ~87 INR/USD, rounded
// to the nearest rupee. Not an independently-set domestic price; it moves
// if the USD tiers change or the exchange rate drifts, so revisit this
// periodically rather than treating it as fixed.
const INR_PRICING: Record<PlanTier, TierPricing> = {
  FREE: { amountMinorUnits: 0, currency: "INR", label: "Free" },
  BUILDER: { amountMinorUnits: 156_600, currency: "INR", label: "₹1,566/month" },
  GROWTH: { amountMinorUnits: 252_300, currency: "INR", label: "₹2,523/month" },
  PRO: { amountMinorUnits: 774_300, currency: "INR", label: "₹7,743/month" },
  AGENCY: { amountMinorUnits: 1_470_300, currency: "INR", label: "₹14,703/month" },
};

export const PLAN_PRICING: Record<BillingCurrency, Record<PlanTier, TierPricing>> = {
  USD: USD_PRICING,
  INR: INR_PRICING,
};

export function isPlanTier(value: unknown): value is PlanTier {
  return typeof value === "string" && (PLAN_TIERS as readonly string[]).includes(value);
}
