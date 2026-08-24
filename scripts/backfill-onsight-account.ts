// One-time migration script: creates the OnSight Account + founder User,
// backfills accountId onto every existing row (all currently belong to
// OnSight, tenant #1), carries over the 3 existing Buffer channel env vars
// into AccountBufferChannel, and backfills KnowledgeBaseEntry.key values.
//
// Credentials come from env vars, not hardcoded — this repo is public.
//   FOUNDER_EMAIL=... FOUNDER_PASSWORD=... npm run backfill:onsight

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

const KB_KEY_BY_TITLE: Record<string, string> = {
  "Brand Identity & Voice": "BRAND_VOICE",
  "Content Pillars, Hooks & Recurring Series": "CONTENT_PILLARS",
  "Product Features (in development — not all live)": "PRODUCT_FEATURES",
  "Safety, Claims & Verification Rules": "SAFETY_RULES",
  "Founder Story": "FOUNDER_STORY",
};

async function main() {
  const FOUNDER_EMAIL = process.env.FOUNDER_EMAIL;
  const FOUNDER_PASSWORD = process.env.FOUNDER_PASSWORD;
  if (!FOUNDER_EMAIL || !FOUNDER_PASSWORD) {
    console.error("Set FOUNDER_EMAIL and FOUNDER_PASSWORD env vars before running this.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email: FOUNDER_EMAIL } });
  if (existing) {
    console.log("Founder user already exists — backfill already ran. Exiting.");
    return;
  }

  const account = await prisma.account.create({
    data: {
      name: "OnSight",
      planTier: null,
      subscriptionStatus: "active", // the house account — not a Stripe customer
    },
  });
  console.log("Created Account:", account.id);

  const passwordHash = await hashPassword(FOUNDER_PASSWORD);
  const user = await prisma.user.create({
    data: {
      email: FOUNDER_EMAIL,
      passwordHash,
      accountId: account.id,
      isAdmin: true,
    },
  });
  console.log("Created founder User:", user.id, user.email);

  const backfillCounts: Record<string, number> = {};
  const models = [
    "mockMention",
    "conversation",
    "post",
    "approval",
    "agentRun",
    "dailySnapshot",
    "trendInput",
    "knowledgeBaseEntry",
  ] as const;

  for (const model of models) {
    // @ts-expect-error — dynamic model access, all 8 share the same accountId shape
    const result = await prisma[model].updateMany({
      where: { accountId: null },
      data: { accountId: account.id },
    });
    backfillCounts[model] = result.count;
  }
  console.log("Backfilled accountId onto existing rows:", backfillCounts);

  // Carry over the 3 Buffer channels this account already has connected
  const channelEnvVars: { platform: string; envVar: string }[] = [
    { platform: "X", envVar: "BUFFER_X_CHANNEL_ID" },
    { platform: "THREADS", envVar: "BUFFER_THREADS_CHANNEL_ID" },
    { platform: "LINKEDIN", envVar: "BUFFER_LINKEDIN_CHANNEL_ID" },
  ];
  for (const { platform, envVar } of channelEnvVars) {
    const bufferChannelId = process.env[envVar];
    if (!bufferChannelId) {
      console.log(`Skipping ${platform} — ${envVar} not set`);
      continue;
    }
    await prisma.accountBufferChannel.upsert({
      where: { accountId_platform: { accountId: account.id, platform } },
      update: { bufferChannelId },
      create: { accountId: account.id, platform, bufferChannelId },
    });
    console.log(`Assigned Buffer channel for ${platform}`);
  }

  // Backfill stable keys onto the 5 known knowledge base entries
  const kbEntries = await prisma.knowledgeBaseEntry.findMany({ where: { accountId: account.id } });
  for (const entry of kbEntries) {
    const key = KB_KEY_BY_TITLE[entry.title];
    if (key) {
      await prisma.knowledgeBaseEntry.update({ where: { id: entry.id }, data: { key } });
      console.log(`Set key=${key} on "${entry.title}"`);
    }
  }

  console.log("\nBackfill complete. Log in at /login with:", FOUNDER_EMAIL);
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
