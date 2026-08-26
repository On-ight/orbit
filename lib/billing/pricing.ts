// PLACEHOLDER PRICING — these amounts have not been confirmed as real prices
// anywhere in this project. They exist so the Razorpay integration has real
// numbers to run against in test mode. Update before accepting a live
// payment with live (non rzp_test_) keys.
export const PLAN_TIERS = ["STARTER", "GROWTH", "AGENCY"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const PLAN_PRICING: Record<PlanTier, { amountPaise: number; label: string }> = {
  STARTER: { amountPaise: 99_900, label: "₹999/month" },
  GROWTH: { amountPaise: 299_900, label: "₹2,999/month" },
  AGENCY: { amountPaise: 799_900, label: "₹7,999/month" },
};

export function isPlanTier(value: unknown): value is PlanTier {
  return typeof value === "string" && (PLAN_TIERS as readonly string[]).includes(value);
}
