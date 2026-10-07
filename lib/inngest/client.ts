import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "orbit",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

export const AGENT_CYCLE_REQUESTED = "agent/cycle.requested" as const;

export interface AgentCycleRequestedData {
  accountId: string;
  triggeredBy: "MANUAL" | "CRON";
}

export const REEL_GENERATION_REQUESTED = "reel/generation.requested" as const;

export interface ReelGenerationRequestedData {
  accountId: string;
  reelId: string;
}

// Sent by app/api/webhooks/heygen/route.ts once HeyGen's own
// avatar_video.success/fail callback fires — the reel-pipeline function's
// step.waitForEvent matches on data.reelId against this event.
export const HEYGEN_VIDEO_COMPLETED = "heygen/video.completed" as const;

export interface HeygenVideoCompletedData {
  reelId: string;
  status: "completed" | "failed";
  videoUrl: string | null;
}

// Sent by app/api/approvals/[id]/route.ts when an Instagram Reel/Carousel
// gets approved and the account has a direct Instagram connection — Meta's
// own container-processing + publish round-trip can take minutes (their own
// guidance: poll up to 5 minutes), so this can't happen synchronously inside
// the approve request the way Buffer's single immediate call could.
export const INSTAGRAM_PUBLISH_REQUESTED = "instagram/publish.requested" as const;

export interface InstagramPublishRequestedData {
  accountId: string;
  approvalId: string;
}

// Sent by app/api/approvals/[id]/route.ts when a Threads post gets approved
// and the account has a direct Threads connection — Meta's own guidance is
// to wait ~30s after creating a container before publishing it, which is
// short enough it could arguably be synchronous, but this stays async via
// Inngest anyway for the same reason as Instagram: one consistent model for
// "Meta platform publish," not two different ones to reason about.
export const THREADS_PUBLISH_REQUESTED = "threads/publish.requested" as const;

export interface ThreadsPublishRequestedData {
  accountId: string;
  approvalId: string;
}
