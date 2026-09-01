import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth } from "@/lib/auth/with-auth";
import { defaultCrudLimiter } from "@/lib/redis/rate-limit";
import { AGENT_CYCLE_TIME_SLOTS } from "@/lib/types";

const CYCLE_MODES = ["MANUAL", "AUTOMATIC"];

export const PATCH = withAuth(async (request, { user: currentUser }) => {
  const body = await request.json().catch(() => null);
  const data: {
    autoApproveMode?: boolean;
    agentCycleTimeSlot?: string;
    cycleMode?: string;
    onboardingCompletedAt?: Date;
    discoveryKeywords?: string;
  } = {};

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

  if (body?.cycleMode !== undefined) {
    if (!CYCLE_MODES.includes(body.cycleMode)) {
      return NextResponse.json({ error: "Invalid cycleMode" }, { status: 400 });
    }
    data.cycleMode = body.cycleMode;
    // Submitting a cycleMode choice is what the onboarding automation step
    // does — mark the sequence complete the first time this happens, so
    // the dashboard layout gate stops routing back into onboarding. MANUAL
    // is itself a valid deliberate choice, not just "hasn't decided yet".
    if (!currentUser.account.onboardingCompletedAt) {
      data.onboardingCompletedAt = new Date();
    }
  }

  if (body?.discoveryKeywords !== undefined) {
    if (typeof body.discoveryKeywords !== "string" || body.discoveryKeywords.length > 500) {
      return NextResponse.json({ error: "discoveryKeywords must be a string under 500 characters" }, { status: 400 });
    }
    data.discoveryKeywords = body.discoveryKeywords.trim();
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
    cycleMode: updated.cycleMode,
    onboardingCompletedAt: updated.onboardingCompletedAt,
    discoveryKeywords: updated.discoveryKeywords,
  });
}, { rateLimit: defaultCrudLimiter });
