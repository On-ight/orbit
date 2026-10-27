import { PLAN_TIERS, type PlanTier } from "./pricing";
import type { Platform } from "@/lib/types";

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
  // Which of X/Threads/LinkedIn Content Agent will actually draft for, even
  // if more than these are connected — checked in
  // lib/agents/content-agent.ts's runContentAgentOnTrend. Instagram (Reels/
  // Carousels) isn't part of this list; that's gated by reelsPerMonth/
  // carouselsPerMonth instead, since it's a different Platform union entirely.
  textPlatforms: Platform[];
  // Cap on distinct platform connections (X/Threads/LinkedIn/Instagram) at
  // once — checked in each app/api/connections/{platform}/start/route.ts
  // before starting a NEW connection (reconnecting an already-connected
  // platform never counts against this). Tiers above 4 are effectively
  // unlimited today since there are only 4 connectable platforms — kept at
  // the real configured number anyway rather than clamped, so it stays
  // correct if more platforms are ever added.
  maxConnectedAccounts: number;
  // Cap on type:"POST" approvals actually approved this month (checked at
  // the approve action in app/api/approvals/[id]/route.ts) — distinct from
  // aiGenerationsPerMonth, which bounds draft/LLM-call volume. You can
  // draft more than you publish; this is the number that's actually shown
  // on the pricing page. null = unlimited.
  publishedPostsPerMonth: number | null;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  // trendResearch is on for Free too: the cron trigger only ever picks up
  // subscriptionStatus: "active" accounts (app/api/cron/agent-cycle/route.ts),
  // so a trial account can never get automatic/daily cycles regardless of
  // this flag — the only way Free runs a cycle at all is the manual button,
  // which already bounds exposure the same way aiGenerationsPerMonth does.
  // Without this, Free's Reel/Carousel opportunity feed can never populate
  // during the trial, since nothing else creates TrendInput rows.
  FREE: {
    aiGenerationsPerMonth: 10,
    trendResearch: true,
    replyDrafting: false,
    reelsPerMonth: 0,
    carouselsPerMonth: 3,
    textPlatforms: ["THREADS"],
    // 2, not 1 — Free's two allowed content types (Threads text, Instagram
    // Carousels) each need their own platform connection, so capping at 1
    // would make one of the two advertised Free features unreachable.
    maxConnectedAccounts: 2,
    publishedPostsPerMonth: 10,
  },
  // Displayed as "Starter" — see the PLAN_TIERS comment in pricing.ts on
  // why the internal/DB identifier stays BUILDER.
  BUILDER: {
    aiGenerationsPerMonth: null,
    trendResearch: true,
    replyDrafting: true,
    // Sized against the storyboard+Gemini Omni Flash pipeline's real cost
    // (~$1.05-1.25/Reel: one storyboard image + per-scene video + narration)
    // — see lib/reels/gemini-client.ts. Real, included allowances, not the
    // "paid add-on" model this used to be (that add-on was never actually
    // sellable — no credit-purchase system existed to charge for it).
    reelsPerMonth: 2,
    carouselsPerMonth: 15,
    textPlatforms: ["X", "THREADS", "LINKEDIN"],
    maxConnectedAccounts: 2,
    publishedPostsPerMonth: 100,
  },
  GROWTH: {
    aiGenerationsPerMonth: null,
    trendResearch: true,
    replyDrafting: true,
    reelsPerMonth: 5,
    carouselsPerMonth: 50,
    textPlatforms: ["X", "THREADS", "LINKEDIN"],
    maxConnectedAccounts: 5,
    publishedPostsPerMonth: 300,
  },
  PRO: {
    aiGenerationsPerMonth: null,
    trendResearch: true,
    replyDrafting: true,
    reelsPerMonth: 12,
    carouselsPerMonth: 100,
    textPlatforms: ["X", "THREADS", "LINKEDIN"],
    maxConnectedAccounts: 10,
    publishedPostsPerMonth: 1_000,
  },
  AGENCY: {
    aiGenerationsPerMonth: null,
    trendResearch: true,
    replyDrafting: true,
    reelsPerMonth: 25,
    carouselsPerMonth: 200,
    textPlatforms: ["X", "THREADS", "LINKEDIN"],
    maxConnectedAccounts: 25,
    publishedPostsPerMonth: 2_500,
  },
};

export function limitsForTier(tier: string | null): PlanLimits {
  return PLAN_LIMITS[(PLAN_TIERS as readonly string[]).includes(tier ?? "") ? (tier as PlanTier) : "FREE"];
}
