const HEYGEN_VIDEOS_URL = "https://api.heygen.com/v3/videos";
const HEYGEN_LOOKS_URL = "https://api.heygen.com/v3/avatars/looks?avatar_type=digital_twin&ownership=private";

export interface HeygenAvatar {
  id: string;
  name: string;
  previewImageUrl: string;
  previewVideoUrl: string | null;
  defaultVoiceId: string;
  ready: boolean;
}

/**
 * Lists the account's own digital-twin avatars — this is the "AI influencer"
 * picker's data source. Scoped to digital_twin/private (not HeyGen's stock
 * library) since the whole point of this feature is your own cloned avatar,
 * not a generic stand-in. Each look carries its own cloned default_voice_id,
 * so there's no separate voice picker — picking the avatar picks the voice.
 */
export async function listHeygenAvatars(): Promise<HeygenAvatar[]> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) throw new Error("HEYGEN_API_KEY is not set");

  const res = await fetch(HEYGEN_LOOKS_URL, { headers: { "x-api-key": apiKey } });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.message ?? body?.error ?? `HTTP ${res.status}`;
    throw new Error(`HeyGen API error: ${detail}`);
  }

  const data = Array.isArray(body?.data) ? body.data : [];
  return data.map((look: Record<string, unknown>) => ({
    id: String(look.id),
    name: String(look.name ?? "Untitled avatar"),
    previewImageUrl: String(look.preview_image_url ?? ""),
    previewVideoUrl: typeof look.preview_video_url === "string" ? look.preview_video_url : null,
    defaultVoiceId: String(look.default_voice_id ?? ""),
    ready: look.status === "completed",
  }));
}

/**
 * Submits an async avatar video — HeyGen calls `callbackUrl` when it
 * finishes (see app/api/webhooks/heygen/route.ts), not polled. Avatar,
 * voice, and captions are all generated in this one call; there's no
 * separate voiceover step or template compositor in this pipeline anymore.
 * `callbackId` is echoed back verbatim on the webhook payload
 * (event_data.callback_id) — passed our own reelId so the webhook can
 * correlate the callback without needing HeyGen's own video_id first.
 */
export async function submitHeygenVideo(args: {
  avatarId: string;
  voiceId: string;
  script: string;
  callbackUrl: string;
  callbackId: string;
}): Promise<string> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) throw new Error("HEYGEN_API_KEY is not set");

  const res = await fetch(HEYGEN_VIDEOS_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "avatar",
      avatar_id: args.avatarId,
      script: args.script,
      voice_id: args.voiceId,
      resolution: "1080p",
      aspect_ratio: "9:16", // Instagram Reels — vertical
      engine: { type: "avatar_iv" },
      callback_url: args.callbackUrl,
      callback_id: args.callbackId,
    }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.message ?? body?.error ?? `HTTP ${res.status}`;
    throw new Error(`HeyGen API error: ${detail}`);
  }

  const videoId = body?.data?.video_id;
  if (!videoId) throw new Error("HeyGen API returned no video_id");
  return videoId;
}
