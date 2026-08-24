import { NextResponse } from "next/server";
import { runAgentCycle } from "@/lib/agents/run-cycle";
import { getCurrentUser } from "@/lib/auth/current-user";

// Web search + multi-platform drafting makes a cycle meaningfully longer
// than the original X-only version — give it real headroom.
export const maxDuration = 60;

export async function POST() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await runAgentCycle(currentUser.accountId, "MANUAL");
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
