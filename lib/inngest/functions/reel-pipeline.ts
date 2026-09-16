import { put } from "@vercel/blob";
import { prisma } from "@/lib/db/prisma";
import {
  inngest,
  REEL_GENERATION_REQUESTED,
  CREATOMATE_RENDER_COMPLETED,
  type ReelGenerationRequestedData,
} from "@/lib/inngest/client";
import { generateVoiceover } from "@/lib/reels/elevenlabs-client";
import { getCreatomateTemplateId, buildCreatomateModifications, submitCreatomateRender } from "@/lib/reels/creatomate-client";
import { generateReelDescriptionAndHashtags, reelScriptSchema } from "@/lib/agents/reel-script-agent";
import type { ReelStyle, ReelVoiceGender, ReelVoiceTone } from "@/lib/types";

/**
 * Renders one Reel: voiceover (ElevenLabs) -> submit render (Creatomate,
 * webhook-driven completion, not polled) -> wait for the webhook -> write
 * description/hashtags -> create the Approval row. Unlike agent-cycle.ts's
 * independent stages, these steps form a strict dependency chain (each
 * needs the previous to have actually succeeded), so this leans on
 * Inngest's own step-level retries rather than per-stage try/catch — the
 * outer try/catch here exists only to make sure the Reel ends up FAILED in
 * our own DB rather than stuck at RENDERING forever once retries exhaust.
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

    if (!reel || !reel.script || !reel.style || !reel.voiceGender || !reel.voiceTone) {
      throw new Error(`Reel ${reelId} is missing a selected script/style/voice — cannot render.`);
    }

    const parsedScript = reelScriptSchema.safeParse(reel.script);
    if (!parsedScript.success) {
      throw new Error(`Reel ${reelId}'s stored script failed validation: ${parsedScript.error.message}`);
    }
    const script = parsedScript.data;
    const style = reel.style as ReelStyle;
    const voiceGender = reel.voiceGender as ReelVoiceGender;
    const voiceTone = reel.voiceTone as ReelVoiceTone;

    try {
      const voiceoverUrl = await step.run("generate-voiceover", async () => {
        const fullText = [script.hook, ...script.scenes.map((s) => s.text)].join(" ");
        const audioBuffer = await generateVoiceover(fullText, voiceGender, voiceTone);
        const blob = await put(`reels/${reelId}/voiceover.mp3`, audioBuffer, {
          access: "public",
          contentType: "audio/mpeg",
          addRandomSuffix: true,
        });
        return blob.url;
      });

      await step.run("submit-render", () => {
        const templateId = getCreatomateTemplateId(style);
        const modifications = buildCreatomateModifications({
          hook: script.hook,
          scenes: script.scenes,
          voiceoverUrl,
        });
        // No incoming request to derive a base URL from here (this runs in a
        // background job, not a route handler) — APP_URL is a new required
        // env var for this feature; VERCEL_URL (Vercel's own auto-populated
        // deployment hostname) is the fallback so preview deploys work
        // without configuring it explicitly.
        const baseUrl = process.env.APP_URL ?? `https://${process.env.VERCEL_URL}`;
        const webhookUrl = `${baseUrl}/api/webhooks/creatomate?secret=${process.env.CREATOMATE_WEBHOOK_SECRET}`;
        return submitCreatomateRender({ templateId, modifications, webhookUrl, metadata: reelId });
      });

      const webhookEvent = await step.waitForEvent("wait-for-render", {
        event: CREATOMATE_RENDER_COMPLETED,
        match: "data.reelId",
        timeout: "10m",
      });

      if (!webhookEvent || webhookEvent.data.status !== "succeeded" || !webhookEvent.data.url) {
        await step.run("mark-failed", () => prisma.reel.update({ where: { id: reelId }, data: { status: "FAILED" } }));
        return { reelId, status: "FAILED" as const };
      }

      const videoUrl = webhookEvent.data.url;

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
