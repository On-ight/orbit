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

// Sent by app/api/webhooks/creatomate/route.ts once Creatomate's own
// render-complete callback fires — the reel-pipeline function's
// step.waitForEvent matches on data.reelId against this event.
export const CREATOMATE_RENDER_COMPLETED = "creatomate/render.completed" as const;

export interface CreatomateRenderCompletedData {
  reelId: string;
  status: string;
  url: string | null;
}
