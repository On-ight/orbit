// International (USD) pricing via Razorpay. Requires Razorpay's
// International Payments feature enabled on the account (KYC/business
// verification on the Razorpay dashboard) — order creation works without it,
// but real customer checkout does not. See lib/billing/razorpay.ts.
export const PLAN_TIERS = ["STARTER", "GROWTH", "AGENCY"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

const CURRENCY = "USD";

export const PLAN_PRICING: Record<PlanTier, { amountMinorUnits: number; currency: string; label: string }> = {
  STARTER: { amountMinorUnits: 4_990, currency: CURRENCY, label: "$49.90/month" },
  GROWTH: { amountMinorUnits: 9_990, currency: CURRENCY, label: "$99.90/month" },
  AGENCY: { amountMinorUnits: 15_990, currency: CURRENCY, label: "$159.90/month" },
};

export function isPlanTier(value: unknown): value is PlanTier {
  return typeof value === "string" && (PLAN_TIERS as readonly string[]).includes(value);
}
