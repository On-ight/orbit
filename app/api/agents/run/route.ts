import { NextResponse } from "next/server";
import { runAgentCycle } from "@/lib/agents/run-cycle";

export async function POST() {
  try {
    const result = await runAgentCycle("MANUAL");
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
