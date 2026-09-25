// One-off utility: the actual "connect a customer's account" step. Buffer's
// own OAuth app registration for new developers is closed, so there's no
// self-serve connect flow — every channel lives on Orbit's own shared Buffer
// account (connected manually at buffer.com), found via `npm run
// buffer:channels`, then assigned here to whichever customer account it
// belongs to.
//
//   npm run buffer:assign -- <account-owner-email> <X|THREADS|LINKEDIN|INSTAGRAM> <bufferChannelId>

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLATFORMS = ["X", "THREADS", "LINKEDIN", "INSTAGRAM"];

async function main() {
  const [email, platform, channelId] = process.argv.slice(2);

  if (!email || !platform || !channelId) {
    console.error("Usage: npm run buffer:assign -- <account-owner-email> <X|THREADS|LINKEDIN|INSTAGRAM> <bufferChannelId>");
    console.error("Find the channelId via: npm run buffer:channels");
    process.exit(1);
  }
  if (!PLATFORMS.includes(platform)) {
    console.error(`Invalid platform "${platform}" — must be one of: ${PLATFORMS.join(", ")}`);
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No User row for ${email}.`);
    process.exit(1);
  }

  const channel = await prisma.accountBufferChannel.upsert({
    where: { accountId_platform: { accountId: user.accountId, platform } },
    create: { accountId: user.accountId, platform, bufferChannelId: channelId },
    update: { bufferChannelId: channelId },
  });

  console.log(`Assigned ${platform} (Buffer channel ${channelId}) to ${email}'s account.`);
  console.log(channel);
}

main()
  .catch((err) => {
    console.error("Failed to assign channel:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
