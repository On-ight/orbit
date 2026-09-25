// One-off utility: run this after setting BUFFER_API_KEY in .env.local to
// find each connected channel's id — then assign it to a customer's account
// via `npm run buffer:assign` (scripts/assign-buffer-channel.ts).
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
    '\nAssign one to a customer account: npm run buffer:assign -- <email> <X|THREADS|LINKEDIN|INSTAGRAM> <id>',
  );
}

main().catch((err) => {
  console.error("Failed to list channels:", err instanceof Error ? err.message : err);
  process.exit(1);
});
