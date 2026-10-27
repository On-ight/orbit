import { put } from "@vercel/blob";
import { prisma } from "@/lib/db/prisma";
import { inngest, REEL_GENERATION_REQUESTED, type ReelGenerationRequestedData } from "@/lib/inngest/client";
import {
  generateStoryboardGrid,
  cropStoryboardPanels,
  generateSceneVideo,
  generateNarrationAudio,
  type StoryboardScene,
} from "@/lib/reels/gemini-client";
import { stitchSceneVideos } from "@/lib/reels/video-stitcher";
import { generateReelDescriptionAndHashtags, reelScriptSchema } from "@/lib/agents/reel-script-agent";

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url} (HTTP ${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

function uploadBuffer(name: string, buffer: Buffer, contentType: string): Promise<string> {
  return put(name, buffer, { access: "public", addRandomSuffix: true, contentType }).then((blob) => blob.url);
}

/**
 * Renders one Reel as a storyboard-driven motion-graphics video: one
 * AI-generated image split into per-scene panels, each animated into a
 * short clip, narrated, and stitched together — replacing HeyGen's
 * avatar-video pipeline. Every step uploads its own output to Blob and
 * returns just the URL, keeping Inngest's step-memoization payloads small
 * and giving the final stitch step stable URLs to download from; each
 * step.run() is its own checkpoint, so no single Vercel invocation needs to
 * survive the whole multi-minute pipeline. The outer try/catch exists only
 * to make sure the Reel ends up FAILED in our own DB rather than stuck at
 * RENDERING forever once Inngest's own step retries exhaust.
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

    try {
      const reel = await step.run("load-reel", () => prisma.reel.findUnique({ where: { id: reelId } }));

      if (!reel || !reel.script) {
        throw new Error(`Reel ${reelId} is missing a selected script — cannot render.`);
      }

      const parsedScript = reelScriptSchema.safeParse(reel.script);
      if (!parsedScript.success) {
        throw new Error(`Reel ${reelId}'s stored script failed validation: ${parsedScript.error.message}`);
      }
      const script = parsedScript.data;
      const scenes: StoryboardScene[] = script.scenes.map((s) => ({ type: s.type, text: s.text }));

      const gridUrl = await step.run("generate-storyboard-grid", async () => {
        const grid = await generateStoryboardGrid(scenes, script.title);
        return uploadBuffer(`reel-${reelId}-storyboard.png`, grid, "image/png");
      });

      const panelUrls = await step.run("crop-storyboard-panels", async () => {
        const grid = await fetchBuffer(gridUrl);
        const panels = await cropStoryboardPanels(grid, scenes.length);
        return Promise.all(
          panels.map((panel, i) => uploadBuffer(`reel-${reelId}-panel-${i + 1}.png`, panel, "image/png")),
        );
      });

      const clipUrls: string[] = [];
      for (let i = 0; i < scenes.length; i++) {
        const clipUrl = await step.run(`generate-scene-video-${i + 1}`, async () => {
          const panel = await fetchBuffer(panelUrls[i]);
          const clip = await generateSceneVideo(panel, scenes[i].text, script.scenes[i].duration);
          return uploadBuffer(`reel-${reelId}-clip-${i + 1}.mp4`, clip, "video/mp4");
        });
        clipUrls.push(clipUrl);
      }

      const narrationUrl = await step.run("generate-narration", async () => {
        const fullNarration = [script.hook, ...script.scenes.map((s) => s.text)].join(" ");
        const audio = await generateNarrationAudio(fullNarration);
        return uploadBuffer(`reel-${reelId}-narration.wav`, audio, "audio/wav");
      });

      const videoUrl = await step.run("stitch-video", async () => {
        const [clips, narration] = await Promise.all([
          Promise.all(clipUrls.map(fetchBuffer)),
          fetchBuffer(narrationUrl),
        ]);
        const finalVideo = await stitchSceneVideos(clips, narration);
        return uploadBuffer(`reel-${reelId}-final.mp4`, finalVideo, "video/mp4");
      });

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
