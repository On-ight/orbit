import { RiskTier } from "@/lib/types";

// Deterministic, intentionally over-inclusive pre-filter. Runs before any
// Claude call. A false positive here just costs one extra human review;
// a false negative could let a risky auto-draft slip through, which is the
// failure mode we're not willing to accept. Keep this list broad.
const NEVER_AUTONOMOUS_KEYWORDS = [
  // complaints / accusations
  "scam", "fraud", "lawsuit", "sue", "suing", "lawyer", "refund",
  "ripped off", "rip off", "stole", "theft", "recall", "unsafe",
  "won't respond", "wont respond", "ignoring me", "never again",
  "reported you", "reporting this", "class action",
  // politics / hot-button
  "election", "president", "senator", "congress", "government policy",
  "immigration policy", "abortion", "gun control", "protest", "war in",
  "ceasefire", "political",
  // unverified safety claims
  "security breach", "hacked", "data leak", "leaked my", "injured",
  "hospital", "allergic reaction", "died", "death",
];

export interface KeywordFilterResult {
  flagged: boolean;
  matchedKeywords: string[];
}

export function runKeywordPreFilter(text: string): KeywordFilterResult {
  const lower = text.toLowerCase();
  const matched = NEVER_AUTONOMOUS_KEYWORDS.filter((kw) => lower.includes(kw));
  return { flagged: matched.length > 0, matchedKeywords: matched };
}

// Action-type -> default tier, per the product's risk model. Individual
// items can still be escalated to NEVER by the keyword filter or the
// model's own self-assessment — this is only the ceiling for "best case."
export const ACTION_TIER_DEFAULTS: Record<string, RiskTier> = {
  COLLECT_TRENDS: "AUTO",
  ANALYZE_POST: "AUTO",
  ANALYZE_ENGAGEMENT: "AUTO",
  CATEGORIZE_CONVERSATION: "AUTO",
  GENERATE_DRAFT: "AUTO",
  GENERATE_ANALYTICS: "AUTO",
  IDENTIFY_COMMUNITY_MEMBER: "AUTO",

  PUBLISH_POST: "APPROVAL",
  REPLY_TO_MENTION: "APPROVAL",
  SEND_COMMUNITY_INVITE: "APPROVAL",
  INSTAGRAM_POST: "APPROVAL",
  SENSITIVE_CONVERSATION: "APPROVAL",
};

const TIER_RANK: Record<RiskTier, number> = { AUTO: 0, APPROVAL: 1, NEVER: 2 };

/** Combine two tier signals, always keeping the more conservative one. */
export function escalate(a: RiskTier, b: RiskTier): RiskTier {
  return TIER_RANK[a] >= TIER_RANK[b] ? a : b;
}

/**
 * Resolves the final risk tier for a piece of content given the model's own
 * self-assessment. If the classification step itself failed, callers MUST
 * pass tier "NEVER" in modelTier — never fall through to AUTO/APPROVAL on
 * an error. This is a hard invariant, not a default.
 */
export function resolveRiskTier(
  text: string,
  modelTier: RiskTier,
): { tier: RiskTier; matchedKeywords: string[] } {
  const { flagged, matchedKeywords } = runKeywordPreFilter(text);
  const keywordTier: RiskTier = flagged ? "NEVER" : "AUTO";
  const tier = escalate(keywordTier, modelTier);
  return { tier, matchedKeywords };
}
