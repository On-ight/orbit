import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth } from "@/lib/auth/with-auth";
import { reelGenerationLimiter } from "@/lib/redis/rate-limit";
import { inngest, REEL_GENERATION_REQUESTED } from "@/lib/inngest/client";
import { limitsForTier } from "@/lib/billing/plan-limits";
import { countReelsThisMonth } from "@/lib/billing/usage";
import { reelScriptSchema } from "@/lib/agents/reel-script-agent";

const VERSION_KEYS = ["versionA", "versionB", "versionC"] as const;
type VersionKey = (typeof VERSION_KEYS)[number];

function isVersionKey(value: unknown): value is VersionKey {
  return typeof value === "string" && (VERSION_KEYS as readonly string[]).includes(value);
}

// Each scene becomes its own Gemini Omni Flash image-to-video call at
// ~$0.10/sec — the real vendor-spend driver for this pipeline. The script
// agent is prompted to keep scenes short, but a script that ignores that
// guidance shouldn't be able to blow past the cost budget, so this clamps
// per-scene duration server-side rather than trusting prompt adherence.
const MAX_SCENE_DURATION_SECONDS = 4;

// This is where the monthly Reel quota is actually enforced — picking a
// version is the step that triggers real vendor spend (the storyboard image
// + per-scene video + narration render), unlike generate-scripts which is
// cheap LLM-only exploration.
export const POST = withAuth<{ params: Promise<{ id: string }> }>(
  async (request, { params, user: currentUser }) => {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const versionKey = body?.versionKey;

    if (!isVersionKey(versionKey)) {
      return NextResponse.json({ error: "Invalid versionKey" }, { status: 400 });
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

    const clampedScript = {
      ...parsedScript.data,
      scenes: parsedScript.data.scenes.map((scene) => ({
        ...scene,
        duration: Math.min(scene.duration, MAX_SCENE_DURATION_SECONDS),
      })),
    };

    await prisma.reel.update({
      where: { id },
      data: {
        status: "RENDERING",
        script: clampedScript,
      },
    });

    try {
      await inngest.send({
        name: REEL_GENERATION_REQUESTED,
        data: { accountId: currentUser.accountId, reelId: id },
      });
    } catch (err) {
      // The Reel row was already flipped to RENDERING above — without this,
      // a failed send here leaves it stuck there forever with no job ever
      // actually enqueued to move it forward. Revert so it's retriable
      // instead of silently stranded.
      console.error("Failed to enqueue REEL_GENERATION_REQUESTED:", err);
      await prisma.reel.update({ where: { id }, data: { status: "SCRIPT_OPTIONS" } });
      return NextResponse.json({ error: "Failed to start rendering — try again" }, { status: 502 });
    }

    return NextResponse.json({ enqueued: true });
  },
  { rateLimit: reelGenerationLimiter },
);
