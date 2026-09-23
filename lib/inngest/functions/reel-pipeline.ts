import { prisma } from "@/lib/db/prisma";
import { SITE_URL } from "@/lib/site-url";
import {
  inngest,
  REEL_GENERATION_REQUESTED,
  HEYGEN_VIDEO_COMPLETED,
  type ReelGenerationRequestedData,
} from "@/lib/inngest/client";
import { submitHeygenVideo } from "@/lib/reels/heygen-client";
import { generateReelDescriptionAndHashtags, reelScriptSchema } from "@/lib/agents/reel-script-agent";

/**
 * Renders one Reel as an AI-avatar video via HeyGen (avatar + voice +
 * captions all generated in one call, webhook-driven completion — not
 * polled) -> wait for the webhook -> write description/hashtags -> create
 * the Approval row. The outer try/catch exists only to make sure the Reel
 * ends up FAILED in our own DB rather than stuck at RENDERING forever once
 * Inngest's own step retries exhaust.
 */
export const reelPipelineFn = inngest.createFunction(
  {
    id: "reel-pipeline",
    concurrency: { limit: 5 },
    retries: 2,
    triggers: [{ event: REEL_GENERATION_REQUESTED }],
  },
  async ({ event, step }) => {
    const { accountId, reelId } = event.data as ReelGenerationRequestedData;

    const reel = await step.run("load-reel", () => prisma.reel.findUnique({ where: { id: reelId } }));

    if (!reel || !reel.script || !reel.avatarId || !reel.voiceId) {
      throw new Error(`Reel ${reelId} is missing a selected script/avatar — cannot render.`);
    }

    const parsedScript = reelScriptSchema.safeParse(reel.script);
    if (!parsedScript.success) {
      throw new Error(`Reel ${reelId}'s stored script failed validation: ${parsedScript.error.message}`);
    }
    const script = parsedScript.data;
    const avatarId = reel.avatarId;
    const voiceId = reel.voiceId;

    try {
      const heygenVideoId = await step.run("submit-avatar-video", () => {
        // One continuous script for the avatar to deliver as a single take —
        // reads naturally as hook followed by the rest of the scenes, rather
        // than a scene-cut composited video.
        const fullScript = [script.hook, ...script.scenes.map((s) => s.text)].join(" ");
        const callbackUrl = `${SITE_URL}/api/webhooks/heygen?secret=${process.env.HEYGEN_WEBHOOK_SECRET}`;
        return submitHeygenVideo({ avatarId, voiceId, script: fullScript, callbackUrl, callbackId: reelId });
      });

      await step.run("record-video-id", () => prisma.reel.update({ where: { id: reelId }, data: { heygenVideoId } }));

      const webhookEvent = await step.waitForEvent("wait-for-avatar-video", {
        event: HEYGEN_VIDEO_COMPLETED,
        match: "data.reelId",
        timeout: "10m",
      });

      if (!webhookEvent || webhookEvent.data.status !== "completed" || !webhookEvent.data.videoUrl) {
        await step.run("mark-failed", () => prisma.reel.update({ where: { id: reelId }, data: { status: "FAILED" } }));
        return { reelId, status: "FAILED" as const };
      }

      const videoUrl = webhookEvent.data.videoUrl;

      const description = await step.run("generate-description", () =>
        generateReelDescriptionAndHashtags(accountId, script.title, script.hook),
      );

      await step.run("finalize-reel", () =>
        prisma.reel.update({
          where: { id: reelId },
          data: {
            status: "READY",
            videoUrl,
            description: description.description,
            hashtags: description.hashtags,
          },
        }),
      );

      await step.run("create-approval", () =>
        prisma.approval.create({
          data: {
            accountId,
            type: "REEL",
            platform: "INSTAGRAM",
            content: description.description,
            aiReasoning: `Generated Reel: ${script.title}`,
            confidence: 0.8,
            riskTier: "APPROVAL", // always — publishing is approval-gated by policy, same as Post
            reelId,
          },
        }),
      );

      return { reelId, status: "READY" as const };
    } catch (err) {
      await step.run("mark-failed-on-error", () =>
        prisma.reel.update({ where: { id: reelId }, data: { status: "FAILED" } }),
      );
      throw err;
    }
  },
);
