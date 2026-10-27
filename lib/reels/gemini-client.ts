// All three capabilities (storyboard image, scene-to-video animation,
// narration) go through Google's Interactions API — one endpoint, one API
// key, replacing HeyGen's avatar-video pipeline. See
// lib/inngest/functions/reel-pipeline.ts for how these are composed.
const INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

const IMAGE_MODEL = "gemini-nano-banana-2.1";
const VIDEO_MODEL = "gemini-omni-1.1-flash";
const TTS_MODEL = "gemini-3.8-flash-lite-tts";

// Gemini's error body shape isn't guaranteed to be flat — mirrors the same
// defensive unwrap heygen-client.ts used for the same reason (a nested error
// object interpolated directly into a template string silently becomes the
// useless literal "[object Object]").
function geminiErrorDetail(body: unknown): string {
  const record = body as Record<string, unknown> | null;
  const error = record?.error as Record<string, unknown> | string | undefined;
  if (typeof error === "string") return error;
  if (error && typeof error.message === "string") return error.message;
  if (typeof record?.message === "string") return record.message;
  return "unknown error";
}

// Tries the simplest plausible response shape first (a top-level
// output_image/output_video/output_audio convenience field), then falls back
// to walking the Interactions API's documented `steps` array for a
// model_output step's matching content block. Not yet verified against a
// real response — validate this against a live call before depending on it
// (see the plan's "build-time unknown" note on this pipeline).
function extractMediaBase64(body: Record<string, unknown>, blockType: "image" | "video" | "audio"): string {
  const convenience = body[`output_${blockType}`] as Record<string, unknown> | undefined;
  if (convenience && typeof convenience.data === "string") return convenience.data;

  const steps = Array.isArray(body.steps) ? body.steps : [];
  for (const step of steps) {
    const s = step as Record<string, unknown>;
    if (s.type !== "model_output") continue;
    const blocks = (Array.isArray(s.content) ? s.content : Array.isArray(s.output) ? s.output : []) as Record<
      string,
      unknown
    >[];
    for (const block of blocks) {
      if (block.type === blockType && typeof block.data === "string") return block.data;
    }
  }
  throw new Error(
    `Gemini Interactions API response had no ${blockType} output — response shape didn't match what this client expects`,
  );
}

async function callInteractionsApi(
  model: string,
  input: Record<string, unknown>[],
  responseFormat: Record<string, unknown>,
  generationConfig?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(INTERACTIONS_URL, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      input,
      response_format: responseFormat,
      ...(generationConfig ? { generation_config: generationConfig } : {}),
    }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok || !body) {
    throw new Error(`Gemini API error (HTTP ${res.status}): ${geminiErrorDetail(body)}`);
  }
  return body as Record<string, unknown>;
}

export interface StoryboardScene {
  type: "hook" | "problem" | "product" | "solution" | "cta";
  text: string;
}

/**
 * One call produces a single wide image split into one panel per scene, all
 * sharing the same characters/art style — cheaper and more visually
 * consistent than generating each scene's image separately.
 */
export async function generateStoryboardGrid(scenes: StoryboardScene[], title: string): Promise<Buffer> {
  const panels = scenes.map((scene, i) => `Panel ${i + 1} (${scene.type}): ${scene.text}`).join("\n");

  const prompt = `Create a single wide horizontal image split into ${scenes.length} equal vertical panels, left to right, like a comic-strip storyboard for a short vertical social video titled "${title}".
Keep the same characters, color palette, and illustration style consistent across every panel — this is one continuous visual story, not ${scenes.length} unrelated images.
${panels}
Illustration only — no text or captions baked into the image.`;

  const body = await callInteractionsApi(IMAGE_MODEL, [{ type: "text", text: prompt }], {
    type: "image",
    image_size: "2K",
  });
  return Buffer.from(extractMediaBase64(body, "image"), "base64");
}

/**
 * Slices the known horizontal-strip layout from generateStoryboardGrid into
 * panelCount equal-width images — deterministic, since we control the exact
 * layout requested above, so no image analysis is needed to find the panels.
 */
export async function cropStoryboardPanels(gridImage: Buffer, panelCount: number): Promise<Buffer[]> {
  const sharp = (await import("sharp")).default;
  const { width, height } = await sharp(gridImage).metadata();
  if (!width || !height) throw new Error("Could not read storyboard grid image dimensions");

  const panelWidth = Math.floor(width / panelCount);
  return Promise.all(
    Array.from({ length: panelCount }, (_, i) =>
      sharp(gridImage)
        .extract({
          left: i * panelWidth,
          top: 0,
          width: i === panelCount - 1 ? width - i * panelWidth : panelWidth,
          height,
        })
        .png()
        .toBuffer(),
    ),
  );
}

/**
 * Animates one storyboard panel into a short vertical motion-graphics clip.
 * durationSeconds is a request, not a guarantee — Gemini Omni Flash's actual
 * clip-length behavior isn't confirmed by Google's docs as of this writing;
 * validate with a real call before trusting exact per-scene durations.
 */
export async function generateSceneVideo(
  panelImage: Buffer,
  sceneText: string,
  durationSeconds: number,
): Promise<Buffer> {
  const prompt = `Animate this storyboard panel into a short, smooth motion-graphics video clip (around ${durationSeconds} seconds) for a vertical social video. Subtle camera movement and motion that brings the illustration to life — keep the exact same art style, do not redraw it. Scene context: ${sceneText}`;

  const body = await callInteractionsApi(
    VIDEO_MODEL,
    [
      { type: "image", data: panelImage.toString("base64"), mime_type: "image/png" },
      { type: "text", text: prompt },
    ],
    { type: "video", aspect_ratio: "9:16", resolution: "720p" },
  );
  return Buffer.from(extractMediaBase64(body, "video"), "base64");
}

/**
 * One narration track over the full script (hook + every scene) rather than
 * per-scene — reads as a single natural take and is one cheap TTS call
 * instead of N.
 */
export async function generateNarrationAudio(fullScript: string): Promise<Buffer> {
  const body = await callInteractionsApi(
    TTS_MODEL,
    [{ type: "user_input", content: [{ type: "text", text: fullScript }] }],
    { type: "audio" },
    { speech_config: [{ voice: "Kore" }] },
  );
  return Buffer.from(extractMediaBase64(body, "audio"), "base64");
}
