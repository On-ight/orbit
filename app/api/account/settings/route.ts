import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AGENT_CYCLE_TIME_SLOTS } from "@/lib/types";

export async function PATCH(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const data: { autoApproveMode?: boolean; agentCycleTimeSlot?: string } = {};

  if (body?.autoApproveMode !== undefined) {
    if (typeof body.autoApproveMode !== "boolean") {
      return NextResponse.json({ error: "autoApproveMode must be a boolean" }, { status: 400 });
    }
    data.autoApproveMode = body.autoApproveMode;
  }

  if (body?.agentCycleTimeSlot !== undefined) {
    if (!(AGENT_CYCLE_TIME_SLOTS as readonly string[]).includes(body.agentCycleTimeSlot)) {
      return NextResponse.json({ error: "Invalid agentCycleTimeSlot" }, { status: 400 });
    }
    data.agentCycleTimeSlot = body.agentCycleTimeSlot;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const updated = await prisma.account.update({
    where: { id: currentUser.accountId },
    data,
  });

  return NextResponse.json({
    autoApproveMode: updated.autoApproveMode,
    agentCycleTimeSlot: updated.agentCycleTimeSlot,
  });
}
