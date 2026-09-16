import { PLAN_TIERS, type PlanTier } from "./pricing";

// Deliberately limited to what's actually real and enforceable today — no
// "workspaces" or "team members" here, since the product has no
// multi-workspace or team-invite support to gate. Adding a claim here without
// backing code would be advertising a capability Orbit can't deliver.
export interface PlanLimits {
  aiGenerationsPerMonth: number | null; // null = unlimited (fair-use)
  trendResearch: boolean;
  replyDrafting: boolean;
  // Reels are real per-unit vendor cost (video render + voiceover), unlike
  // text generations — kept as its own hard cap, never unlimited, per the
  // explicit warning that unlimited AI video would destroy margins.
  reelsPerMonth: number;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  FREE: { aiGenerationsPerMonth: 10, trendResearch: false, replyDrafting: false, reelsPerMonth: 0 },
  BUILDER: { aiGenerationsPerMonth: 100, trendResearch: true, replyDrafting: true, reelsPerMonth: 5 },
  GROWTH: { aiGenerationsPerMonth: null, trendResearch: true, replyDrafting: true, reelsPerMonth: 20 },
  AGENCY: { aiGenerationsPerMonth: null, trendResearch: true, replyDrafting: true, reelsPerMonth: 100 },
};

export function limitsForTier(tier: string | null): PlanLimits {
  return PLAN_LIMITS[(PLAN_TIERS as readonly string[]).includes(tier ?? "") ? (tier as PlanTier) : "FREE"];
}
