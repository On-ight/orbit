import type { ReelVoiceGender, ReelVoiceTone } from "@/lib/types";

const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

/**
 * Curated voice IDs, not exposed directly to users (the brief is explicit:
 * "don't expose 100 voice settings" — pick a small number of good voices
 * instead). A per-gender fallback (ELEVENLABS_VOICE_FEMALE/_MALE) is enough
 * to make the feature work; per-tone overrides (ELEVENLABS_VOICE_FEMALE_
 * ENERGETIC etc.) are optional finer control once there's a real account to
 * audition voices from.
 */
export function getVoiceId(gender: ReelVoiceGender, tone: ReelVoiceTone): string {
  const specific = process.env[`ELEVENLABS_VOICE_${gender}_${tone}`];
  const fallback = process.env[`ELEVENLABS_VOICE_${gender}`];
  const voiceId = specific ?? fallback;
  if (!voiceId) {
    throw new Error(
      `No ElevenLabs voice configured for ${gender} — set ELEVENLABS_VOICE_${gender} (or ELEVENLABS_VOICE_${gender}_${tone} for finer control).`,
    );
  }
  return voiceId;
}

/**
 * Returns raw audio bytes (mp3) — ElevenLabs' TTS endpoint responds with the
 * audio file directly, not a JSON body with a URL, unlike Creatomate.
 */
export async function generateVoiceover(
  text: string,
  gender: ReelVoiceGender,
  tone: ReelVoiceTone,
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set");

  const voiceId = getVoiceId(gender, tone);

  const res = await fetch(`${ELEVENLABS_TTS_URL}/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, model_id: DEFAULT_MODEL_ID }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs API error: HTTP ${res.status}${detail ? ` — ${detail}` : ""}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
