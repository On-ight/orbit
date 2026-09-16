import type { ReelStyle } from "@/lib/types";

const CREATOMATE_RENDERS_URL = "https://api.creatomate.com/v2/renders";

// One template per style, built by hand in Creatomate's visual editor — not
// something this codebase can create via API. Each template must use these
// exact element names so `buildCreatomateModifications` can populate them:
// Hook-Text, Scene-1-Text..Scene-N-Text, CTA-Text, Voiceover-Audio.
const TEMPLATE_ENV_VAR: Record<ReelStyle, string> = {
  PRODUCT: "CREATOMATE_TEMPLATE_PRODUCT",
  UGC: "CREATOMATE_TEMPLATE_UGC",
  CINEMATIC: "CREATOMATE_TEMPLATE_CINEMATIC",
  FOUNDER: "CREATOMATE_TEMPLATE_FOUNDER",
  MEME: "CREATOMATE_TEMPLATE_MEME",
};

export function getCreatomateTemplateId(style: ReelStyle): string {
  const envVar = TEMPLATE_ENV_VAR[style];
  const templateId = process.env[envVar];
  if (!templateId) {
    throw new Error(`${envVar} is not set — build this style's template in Creatomate's editor first.`);
  }
  return templateId;
}

interface ReelSceneForRender {
  type: "hook" | "problem" | "product" | "solution" | "cta";
  text: string;
}

/**
 * Maps a script's scenes onto the fixed element-naming contract every
 * Creatomate template must follow (see comment above). The hook and CTA get
 * their own named elements since they're always present; everything else is
 * numbered in order.
 */
export function buildCreatomateModifications(args: {
  hook: string;
  scenes: ReelSceneForRender[];
  voiceoverUrl: string;
}): Record<string, string> {
  const modifications: Record<string, string> = {
    "Hook-Text": args.hook,
    "Voiceover-Audio": args.voiceoverUrl,
  };

  let sceneNumber = 0;
  for (const scene of args.scenes) {
    if (scene.type === "hook") continue; // already covered by Hook-Text
    if (scene.type === "cta") {
      modifications["CTA-Text"] = scene.text;
      continue;
    }
    sceneNumber += 1;
    modifications[`Scene-${sceneNumber}-Text`] = scene.text;
  }

  return modifications;
}

export interface CreatomateRender {
  id: string;
  status: string;
  url: string | null;
  snapshot_url?: string | null;
}

/**
 * Submits an async render — Creatomate calls `webhookUrl` when it finishes
 * (see app/api/webhooks/creatomate/route.ts), rather than this function
 * polling for completion. `metadata` is opaque to Creatomate and echoed back
 * verbatim on the webhook payload — passed our own reelId so the webhook can
 * correlate the callback without needing Creatomate's own render id first.
 */
export async function submitCreatomateRender(args: {
  templateId: string;
  modifications: Record<string, string>;
  webhookUrl: string;
  metadata: string;
}): Promise<CreatomateRender> {
  const apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) throw new Error("CREATOMATE_API_KEY is not set");

  const res = await fetch(CREATOMATE_RENDERS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      template_id: args.templateId,
      modifications: args.modifications,
      webhook_url: args.webhookUrl,
      metadata: args.metadata,
    }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.message ?? body?.error ?? `HTTP ${res.status}`;
    throw new Error(`Creatomate API error: ${detail}`);
  }

  // The endpoint returns an array — a single request can produce multiple
  // outputs (e.g. different formats); this codebase only ever requests one.
  const render = Array.isArray(body) ? body[0] : body;
  if (!render?.id) throw new Error("Creatomate API returned no render");
  return render as CreatomateRender;
}
