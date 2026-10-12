const HEYGEN_VIDEOS_URL = "https://api.heygen.com/v3/videos";
const HEYGEN_LOOKS_URL = "https://api.heygen.com/v3/avatars/looks";
// Your own cloned likeness — the account's "AI influencer."
const OWN_LOOKS_URL = `${HEYGEN_LOOKS_URL}?avatar_type=digital_twin&ownership=private`;
// HeyGen's premade presenter library — not a clone of anyone on this
// account, just a generic stand-in you can also pick from. One page (the
// API max of 50) rather than full pagination — plenty to choose from
// without building out paging UI for this.
const STOCK_LOOKS_URL = `${HEYGEN_LOOKS_URL}?avatar_type=studio_avatar&ownership=public&limit=50`;

// HeyGen's error body isn't consistently shaped — sometimes a flat string
// under .message/.error, sometimes .error is itself a nested object (e.g.
// { error: { message, code } }). Interpolating that object directly into a
// template string silently produces the literal text "[object Object]" via
// its default toString, discarding the real detail — seen in practice in a
// real failure. This always surfaces something readable instead.
function heygenErrorDetail(body: unknown): string {
  const record = body as Record<string, unknown> | null;
  const candidate = record?.message ?? record?.error;
  if (typeof candidate === "string") return candidate;
  if (candidate && typeof candidate === "object") {
    const nested = candidate as Record<string, unknown>;
    if (typeof nested.message === "string") return nested.message;
    return JSON.stringify(candidate);
  }
  return "unknown error";
}

export interface HeygenAvatar {
  id: string;
  name: string;
  previewImageUrl: string;
  previewVideoUrl: string | null;
  defaultVoiceId: string;
  ready: boolean;
  // "mine" = this account's own cloned digital twin. "stock" = one of
  // HeyGen's premade presenter avatars, usable by anyone — not a clone of
  // this account's own likeness. Lets the picker group/label them
  // separately rather than presenting a stock presenter as "your" avatar.
  source: "mine" | "stock";
}

async function fetchHeygenLooks(url: string, apiKey: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(url, { headers: { "x-api-key": apiKey } });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`HeyGen API error (HTTP ${res.status}): ${heygenErrorDetail(body)}`);
  }
  return Array.isArray(body?.data) ? body.data : [];
}

function toHeygenAvatar(look: Record<string, unknown>, source: "mine" | "stock"): HeygenAvatar {
  return {
    id: String(look.id),
    name: String(look.name ?? "Untitled avatar"),
    previewImageUrl: String(look.preview_image_url ?? ""),
    previewVideoUrl: typeof look.preview_video_url === "string" ? look.preview_video_url : null,
    defaultVoiceId: String(look.default_voice_id ?? ""),
    ready: look.status === "completed",
    source,
  };
}

/**
 * Lists avatars for the "AI influencer" picker: this account's own cloned
 * digital twins first, plus HeyGen's premade stock presenters as a
 * fallback/alternative — not everyone wants to clone themselves, and a
 * fresh account has zero digital twins until they create one. Each look
 * carries its own default_voice_id, so there's no separate voice picker —
 * picking the avatar picks the voice too, for both kinds.
 */
export async function listHeygenAvatars(): Promise<HeygenAvatar[]> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) throw new Error("HEYGEN_API_KEY is not set");

  // Own avatars are the core path — a failure there still throws, same as
  // before. Stock is a pure addition on top, so a failure fetching it
  // (plan restriction, API hiccup) degrades to "no stock options shown"
  // rather than breaking the whole picker over an enhancement.
  const mine = await fetchHeygenLooks(OWN_LOOKS_URL, apiKey);
  let stock: Record<string, unknown>[] = [];
  try {
    stock = await fetchHeygenLooks(STOCK_LOOKS_URL, apiKey);
  } catch (err) {
    console.error("Failed to fetch HeyGen stock avatars (non-fatal):", err);
  }

  return [
    ...mine.map((look) => toHeygenAvatar(look, "mine")),
    ...stock.map((look) => toHeygenAvatar(look, "stock")),
  ];
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
    throw new Error(`HeyGen API error (HTTP ${res.status}): ${heygenErrorDetail(body)}`);
  }

  const videoId = body?.data?.video_id;
  if (!videoId) throw new Error("HeyGen API returned no video_id");
  return videoId;
}
