import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth } from "@/lib/auth/with-auth";
import { reelGenerationLimiter } from "@/lib/redis/rate-limit";
import { generateCarouselVersions } from "@/lib/agents/carousel-script-agent";
import { friendlyLlmErrorMessage } from "@/lib/agents/llm-client";
import { REEL_MODES, type ReelMode } from "@/lib/types";

function isReelMode(value: unknown): value is ReelMode {
  return typeof value === "string" && (REEL_MODES as readonly string[]).includes(value);
}

// Not quota-gated — exploring carousel angles is cheap LLM-only work, same
// reasoning as app/api/reels/generate-scripts/route.ts. The reelGenerationLimiter
// is reused rather than a new limiter — same "external LLM call, prevent
// abuse" shape applies regardless of content format.
export const POST = withAuth(
  async (request, { user: currentUser }) => {
    const body = await request.json().catch(() => null);
    const mode = body?.mode;
    const sourceTrendId = typeof body?.sourceTrendId === "string" ? body.sourceTrendId : "";

    if (!isReelMode(mode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }
    if (!sourceTrendId) {
      return NextResponse.json({ error: "sourceTrendId is required" }, { status: 400 });
    }

    const trend = await prisma.trendInput.findUnique({ where: { id: sourceTrendId } });
    if (!trend || trend.accountId !== currentUser.accountId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // One Carousel per source trend — return the existing one rather than
    // generating (and paying for) a duplicate set of script options.
    const existing = await prisma.carousel.findFirst({ where: { accountId: currentUser.accountId, sourceTrendId } });
    if (existing) return NextResponse.json(existing);

    try {
      const versions = await generateCarouselVersions(
        currentUser.accountId,
        mode,
        trend.topic,
        trend.rawSignal,
      );
      const carousel = await prisma.carousel.create({
        data: {
          accountId: currentUser.accountId,
          mode,
          status: "SCRIPT_OPTIONS",
          title: trend.topic,
          versions,
          sourceTrendId,
        },
      });
      return NextResponse.json(carousel);
    } catch (err) {
      console.error("Carousel script generation failed:", err);
      return NextResponse.json({ error: friendlyLlmErrorMessage(err) }, { status: 500 });
    }
  },
  { rateLimit: reelGenerationLimiter },
);
