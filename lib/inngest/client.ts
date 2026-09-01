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
