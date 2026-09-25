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
  // Carousels render via next/og in-process (no vendor render cost like
  // Reels), so this cap only bounds LLM-call volume — meaningfully more
  // generous than reelsPerMonth at every tier.
  carouselsPerMonth: number;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  // trendResearch is on for Free too: the cron trigger only ever picks up
  // subscriptionStatus: "active" accounts (app/api/cron/agent-cycle/route.ts),
  // so a trial account can never get automatic/daily cycles regardless of
  // this flag — the only way Free runs a cycle at all is the manual button,
  // which already bounds exposure the same way aiGenerationsPerMonth does.
  // Without this, Free's Reel/Carousel opportunity feed can never populate
  // during the trial, since nothing else creates TrendInput rows.
  FREE: { aiGenerationsPerMonth: 10, trendResearch: true, replyDrafting: false, reelsPerMonth: 0, carouselsPerMonth: 3 },
  BUILDER: { aiGenerationsPerMonth: 100, trendResearch: true, replyDrafting: true, reelsPerMonth: 5, carouselsPerMonth: 15 },
  GROWTH: { aiGenerationsPerMonth: null, trendResearch: true, replyDrafting: true, reelsPerMonth: 20, carouselsPerMonth: 50 },
  AGENCY: { aiGenerationsPerMonth: null, trendResearch: true, replyDrafting: true, reelsPerMonth: 100, carouselsPerMonth: 200 },
};

export function limitsForTier(tier: string | null): PlanLimits {
  return PLAN_LIMITS[(PLAN_TIERS as readonly string[]).includes(tier ?? "") ? (tier as PlanTier) : "FREE"];
}
