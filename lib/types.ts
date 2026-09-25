export const RISK_TIERS = ["AUTO", "APPROVAL", "NEVER"] as const;
export type RiskTier = (typeof RISK_TIERS)[number];

export const INTENT_LEVELS = ["HIGH", "MEDIUM", "LOW"] as const;
export type IntentLevel = (typeof INTENT_LEVELS)[number];

export const CONVERSATION_STATUSES = ["NEW", "DRAFTED", "REPLIED", "IGNORED"] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const APPROVAL_TYPES = ["POST", "REPLY", "COMMUNITY_INVITE", "REEL", "CAROUSEL"] as const;
export type ApprovalType = (typeof APPROVAL_TYPES)[number];

export const APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED", "EDITED"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const POST_STATUSES = ["DRAFT", "SCHEDULED", "PUBLISHED"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const AGENT_RUN_STATUSES = ["RUNNING", "COMPLETED", "FAILED"] as const;
export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];

export const PLATFORMS = ["X", "THREADS", "LINKEDIN"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_CHAR_LIMITS: Record<Platform, number> = {
  X: 280,
  THREADS: 500,
  LINKEDIN: 3000,
};

// Fixed daily cron slots (IST) — not an arbitrary time picker. Vercel Cron
// fires at fixed schedules, not per-account ones, so each of these
// corresponds to its own entry in vercel.json; the value here is what's
// stored on Account.agentCycleTimeSlot and matched against the `slot`
// query param the matching cron job sends.
export const AGENT_CYCLE_TIME_SLOTS = ["00:00", "06:00", "12:00", "18:00"] as const;
export type AgentCycleTimeSlot = (typeof AGENT_CYCLE_TIME_SLOTS)[number];

// Collected once at signup — only COMPANY changes what the account-name
// field asks for ("Company name" vs "Your name"), but all five are stored
// so who's actually signing up isn't just discarded.
export const ACCOUNT_TYPES = ["INDIVIDUAL", "COMPANY", "INFLUENCER", "ARTIST", "OTHER"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  INDIVIDUAL: "Individual",
  COMPANY: "Company",
  INFLUENCER: "Influencer",
  ARTIST: "Artist",
  OTHER: "Other",
};

// Reels — short-form video. Deliberately NOT added to PLATFORMS: that union
// means "text-post platform" (approval tabs, PLATFORM_CHAR_LIMITS,
// content-agent.ts's drafting loop), which Instagram never is, even though
// it's now a real connectable/publishable channel via Buffer
// (BufferPlatform, lib/publishing/buffer-client.ts, is the wider type for
// that). Approval.platform for a Reel is just the literal string
// "INSTAGRAM", an unconstrained DB column, not this shared union.
export const REEL_MODES = ["PRODUCT_LAUNCH", "EDUCATIONAL", "TREND_STORY"] as const;
export type ReelMode = (typeof REEL_MODES)[number];

export const REEL_MODE_LABELS: Record<ReelMode, string> = {
  PRODUCT_LAUNCH: "🚀 Product Launch",
  EDUCATIONAL: "🧠 Educational",
  TREND_STORY: "🔥 Trend / Story",
};

export const REEL_STATUSES = [
  "OPPORTUNITY",
  "SCRIPT_OPTIONS",
  "RENDERING",
  "READY",
  "FAILED",
  "APPROVED",
  "REJECTED",
] as const;
export type ReelStatus = (typeof REEL_STATUSES)[number];

// Instagram's actual caption limit — kept local to Reels rather than added
// to PLATFORM_CHAR_LIMITS, for the same reason INSTAGRAM isn't in PLATFORMS.
export const INSTAGRAM_CAPTION_LIMIT = 2200;
