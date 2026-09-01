import { PLAN_TIERS, type PlanTier } from "./pricing";

// Deliberately limited to what's actually real and enforceable today — no
// "workspaces" or "team members" here, since the product has no
// multi-workspace or team-invite support to gate. Adding a claim here without
// backing code would be advertising a capability Orbit can't deliver.
export interface PlanLimits {
  aiGenerationsPerMonth: number | null; // null = unlimited (fair-use)
  trendResearch: boolean;
  replyDrafting: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  FREE: { aiGenerationsPerMonth: 10, trendResearch: false, replyDrafting: false },
  BUILDER: { aiGenerationsPerMonth: 100, trendResearch: true, replyDrafting: true },
  GROWTH: { aiGenerationsPerMonth: null, trendResearch: true, replyDrafting: true },
  AGENCY: { aiGenerationsPerMonth: null, trendResearch: true, replyDrafting: true },
};

export function limitsForTier(tier: string | null): PlanLimits {
  return PLAN_LIMITS[(PLAN_TIERS as readonly string[]).includes(tier ?? "") ? (tier as PlanTier) : "FREE"];
}
