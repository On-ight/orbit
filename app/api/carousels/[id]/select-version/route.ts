import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db/prisma";
import { withAuth } from "@/lib/auth/with-auth";
import { reelGenerationLimiter } from "@/lib/redis/rate-limit";
import { limitsForTier } from "@/lib/billing/plan-limits";
import { countCarouselsThisMonth } from "@/lib/billing/usage";
import { carouselVersionSchema } from "@/lib/agents/carousel-script-agent";
import { generateReelDescriptionAndHashtags } from "@/lib/agents/reel-script-agent";
import { renderCarouselSlides } from "@/lib/carousels/slide-renderer";

// This one request does everything Reels split across an async Inngest
// pipeline (render + upload + caption LLM call) — comfortably fast, but
// past Vercel's short default on some plans, so this mirrors the same
// explicit maxDuration app/api/inngest/route.ts sets for the same reason.
export const maxDuration = 30;

const VERSION_KEYS = ["versionA", "versionB", "versionC"] as const;
type VersionKey = (typeof VERSION_KEYS)[number];

function isVersionKey(value: unknown): value is VersionKey {
  return typeof value === "string" && (VERSION_KEYS as readonly string[]).includes(value);
}

// Unlike Reels, rendering here is synchronous — next/og's ImageResponse runs
// in-process with no external vendor wait, so this route does the whole
// pick-a-version -> render -> ready flow in one request, no Inngest event,
// no webhook, no polling. The monthly Carousel quota is still enforced here
// (not at generate-scripts) since this is the step that actually produces
// billable content, matching the Reels quota-placement reasoning.
export const POST = withAuth<{ params: Promise<{ id: string }> }>(
  async (request, { params, user: currentUser }) => {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const versionKey = body?.versionKey;

    if (!isVersionKey(versionKey)) {
      return NextResponse.json({ error: "Invalid versionKey" }, { status: 400 });
    }

    const carousel = await prisma.carousel.findUnique({ where: { id } });
    if (!carousel || carousel.accountId !== currentUser.accountId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (carousel.status !== "SCRIPT_OPTIONS") {
      return NextResponse.json({ error: "This Carousel isn't awaiting a version choice" }, { status: 400 });
    }

    const versions = carousel.versions as Record<string, unknown> | null;
    const parsedVersion = carouselVersionSchema.safeParse(versions?.[versionKey]);
    if (!parsedVersion.success) {
      return NextResponse.json({ error: "Stored script versions are invalid" }, { status: 500 });
    }

    const limits = limitsForTier(currentUser.account.planTier);
    const used = await countCarouselsThisMonth(currentUser.accountId);
    if (used >= limits.carouselsPerMonth) {
      return NextResponse.json(
        { error: `You've used all ${limits.carouselsPerMonth} Carousels included in your plan this month.` },
        { status: 403 },
      );
    }

    const script = parsedVersion.data;

    await prisma.carousel.update({
      where: { id },
      data: { status: "RENDERING", slides: script.slides },
    });

    try {
      const pngBuffers = await renderCarouselSlides(script.slides, currentUser.account.name);
      const uploaded = await Promise.all(
        pngBuffers.map((buffer, index) =>
          put(`carousel-${id}-slide-${index + 1}.png`, buffer, {
            access: "public",
            addRandomSuffix: true,
            contentType: "image/png",
          }),
        ),
      );
      const slideImageUrls = uploaded.map((blob) => blob.url);

      const description = await generateReelDescriptionAndHashtags(
        currentUser.accountId,
        script.title,
        script.slides[0].headline,
      );

      await prisma.carousel.update({
        where: { id },
        data: {
          status: "READY",
          slideImageUrls,
          description: description.description,
          hashtags: description.hashtags,
        },
      });

      await prisma.approval.create({
        data: {
          accountId: currentUser.accountId,
          type: "CAROUSEL",
          platform: "INSTAGRAM",
          content: description.description,
          aiReasoning: `Generated Carousel: ${script.title}`,
          confidence: 0.8,
          riskTier: "APPROVAL", // always — publishing is approval-gated by policy, same as Reel
          carouselId: id,
        },
      });

      return NextResponse.json({ status: "READY" });
    } catch (err) {
      await prisma.carousel.update({ where: { id }, data: { status: "FAILED" } });
      return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
  },
  { rateLimit: reelGenerationLimiter },
);
