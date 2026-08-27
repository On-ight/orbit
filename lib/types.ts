export const RISK_TIERS = ["AUTO", "APPROVAL", "NEVER"] as const;
export type RiskTier = (typeof RISK_TIERS)[number];

export const INTENT_LEVELS = ["HIGH", "MEDIUM", "LOW"] as const;
export type IntentLevel = (typeof INTENT_LEVELS)[number];

export const CONVERSATION_STATUSES = ["NEW", "DRAFTED", "REPLIED", "IGNORED"] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const APPROVAL_TYPES = ["POST", "REPLY", "COMMUNITY_INVITE"] as const;
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
