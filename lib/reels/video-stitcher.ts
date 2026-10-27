import { spawn } from "node:child_process";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpeg from "@ffmpeg-installer/ffmpeg";

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpeg.path, args);
    let stderr = "";
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-2000)}`));
    });
  });
}

/**
 * Concatenates the per-scene clips in order and muxes the single narration
 * track underneath (any audio the clips themselves carry is dropped — one
 * consistent TTS voice, not N possibly-inconsistent generated tracks).
 * Uses ffmpeg's concat *filter* (decode/re-encode) rather than the concat
 * *demuxer* (stream-copy), since separate Gemini calls aren't guaranteed to
 * produce identical codec parameters across clips — the filter tolerates
 * that, the demuxer does not.
 */
export async function stitchSceneVideos(clips: Buffer[], narration: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), "orbit-reel-"));
  try {
    const clipPaths = await Promise.all(
      clips.map(async (clip, i) => {
        const clipPath = path.join(dir, `clip-${i}.mp4`);
        await writeFile(clipPath, clip);
        return clipPath;
      }),
    );
    const narrationPath = path.join(dir, "narration.wav");
    await writeFile(narrationPath, narration);
    const outputPath = path.join(dir, "output.mp4");

    const videoInputArgs = clipPaths.flatMap((clipPath) => ["-i", clipPath]);
    const concatRefs = clipPaths.map((_, i) => `[${i}:v]`).join("");
    const filter = `${concatRefs}concat=n=${clipPaths.length}:v=1:a=0[outv]`;

    await runFfmpeg([
      ...videoInputArgs,
      "-i",
      narrationPath,
      "-filter_complex",
      filter,
      "-map",
      "[outv]",
      "-map",
      `${clipPaths.length}:a`,
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      "-shortest",
      "-y",
      outputPath,
    ]);

    return await readFile(outputPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
