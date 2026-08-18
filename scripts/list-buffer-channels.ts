// One-off utility: run this after setting BUFFER_API_KEY in .env.local to
// find the channel ID(s) to put in BUFFER_X_CHANNEL_ID / BUFFER_THREADS_CHANNEL_ID /
// BUFFER_LINKEDIN_CHANNEL_ID.
//
//   npm run buffer:channels

import { listBufferChannels } from "../lib/publishing/buffer-client";

async function main() {
  const channels = await listBufferChannels();
  if (channels.length === 0) {
    console.log("No channels connected to this Buffer account yet — connect one at buffer.com first.");
    return;
  }
  console.log("Connected Buffer channels:\n");
  for (const c of channels) {
    console.log(`  ${c.service.padEnd(16)} ${c.name.padEnd(30)} id: ${c.id}`);
  }
  console.log(
    "\nCopy each id into the matching env var: BUFFER_X_CHANNEL_ID, BUFFER_THREADS_CHANNEL_ID, or BUFFER_LINKEDIN_CHANNEL_ID.",
  );
}

main().catch((err) => {
  console.error("Failed to list channels:", err instanceof Error ? err.message : err);
  process.exit(1);
});
