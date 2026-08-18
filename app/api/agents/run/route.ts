import { NextResponse } from "next/server";
import { runAgentCycle } from "@/lib/agents/run-cycle";

// Web search + multi-platform drafting makes a cycle meaningfully longer
// than the original X-only version — give it real headroom.
export const maxDuration = 60;

export async function POST() {
  try {
    const result = await runAgentCycle("MANUAL");
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
