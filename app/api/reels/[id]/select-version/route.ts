import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth } from "@/lib/auth/with-auth";
import { reelGenerationLimiter } from "@/lib/redis/rate-limit";
import { inngest, REEL_GENERATION_REQUESTED } from "@/lib/inngest/client";
import { limitsForTier } from "@/lib/billing/plan-limits";
import { countReelsThisMonth } from "@/lib/billing/usage";
import { reelScriptSchema } from "@/lib/agents/reel-script-agent";
import {
  REEL_STYLES,
  REEL_VOICE_GENDERS,
  REEL_VOICE_TONES,
  type ReelStyle,
  type ReelVoiceGender,
  type ReelVoiceTone,
} from "@/lib/types";

const VERSION_KEYS = ["versionA", "versionB", "versionC"] as const;
type VersionKey = (typeof VERSION_KEYS)[number];

function isVersionKey(value: unknown): value is VersionKey {
  return typeof value === "string" && (VERSION_KEYS as readonly string[]).includes(value);
}
function isReelStyle(value: unknown): value is ReelStyle {
  return typeof value === "string" && (REEL_STYLES as readonly string[]).includes(value);
}
function isVoiceGender(value: unknown): value is ReelVoiceGender {
  return typeof value === "string" && (REEL_VOICE_GENDERS as readonly string[]).includes(value);
}
function isVoiceTone(value: unknown): value is ReelVoiceTone {
  return typeof value === "string" && (REEL_VOICE_TONES as readonly string[]).includes(value);
}

// This is where the monthly Reel quota is actually enforced — picking a
// version is the step that triggers real vendor spend (voiceover + render),
// unlike generate-scripts which is cheap LLM-only exploration.
export const POST = withAuth<{ params: Promise<{ id: string }> }>(
  async (request, { params, user: currentUser }) => {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const versionKey = body?.versionKey;
    const style = body?.style;
    const voiceGender = body?.voiceGender;
    const voiceTone = body?.voiceTone;

    if (!isVersionKey(versionKey) || !isReelStyle(style) || !isVoiceGender(voiceGender) || !isVoiceTone(voiceTone)) {
      return NextResponse.json({ error: "Invalid versionKey/style/voiceGender/voiceTone" }, { status: 400 });
    }

    const reel = await prisma.reel.findUnique({ where: { id } });
    if (!reel || reel.accountId !== currentUser.accountId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (reel.status !== "SCRIPT_OPTIONS") {
      return NextResponse.json({ error: "This Reel isn't awaiting a version choice" }, { status: 400 });
    }

    const versions = reel.versions as Record<string, unknown> | null;
    const parsedScript = reelScriptSchema.safeParse(versions?.[versionKey]);
    if (!parsedScript.success) {
      return NextResponse.json({ error: "Stored script versions are invalid" }, { status: 500 });
    }

    const limits = limitsForTier(currentUser.account.planTier);
    const used = await countReelsThisMonth(currentUser.accountId);
    if (used >= limits.reelsPerMonth) {
      return NextResponse.json(
        { error: `You've used all ${limits.reelsPerMonth} Reels included in your plan this month.` },
        { status: 403 },
      );
    }

    await prisma.reel.update({
      where: { id },
      data: {
        status: "RENDERING",
        style,
        voiceGender,
        voiceTone,
        script: parsedScript.data,
      },
    });

    await inngest.send({
      name: REEL_GENERATION_REQUESTED,
      data: { accountId: currentUser.accountId, reelId: id },
    });

    return NextResponse.json({ enqueued: true });
  },
  { rateLimit: reelGenerationLimiter },
);
