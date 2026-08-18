import { NextRequest, NextResponse } from "next/server";
import { runAgentCycle } from "@/lib/agents/run-cycle";

// Web search + multi-platform drafting makes a cycle meaningfully longer
// than the original X-only version — give it real headroom.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  // Fail closed: reject if the secret is simply unset, not just on a
  // mismatch — an unset env var must never accidentally let a bare
  // "Bearer undefined" through.
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAgentCycle("CRON");
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
