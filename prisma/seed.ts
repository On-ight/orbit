import { PrismaClient } from "@prisma/client";
import { SEED_MENTIONS } from "../lib/db/seed-data/mock-mentions";
import { SEED_TRENDS } from "../lib/db/seed-data/mock-trends";

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.approval.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.mockMention.deleteMany();
  await prisma.post.deleteMany();
  await prisma.trendInput.deleteMany();
  await prisma.agentRun.deleteMany();
  await prisma.dailySnapshot.deleteMany();

  console.log(`Seeding ${SEED_MENTIONS.length} mock mentions...`);
  for (const mention of SEED_MENTIONS) {
    await prisma.mockMention.create({
      data: {
        authorHandle: mention.authorHandle,
        authorName: mention.authorName,
        text: mention.text,
        likes: mention.likes,
        replyCount: mention.replyCount,
        postedAt: daysAgo(mention.daysAgo),
      },
    });
  }

  console.log(`Seeding ${SEED_TRENDS.length} trend inputs...`);
  for (const trend of SEED_TRENDS) {
    await prisma.trendInput.create({
      data: { topic: trend.topic, rawSignal: trend.rawSignal },
    });
  }

  console.log("Seeding sample posts (pre-existing pipeline)...");
  await prisma.post.createMany({
    data: [
      {
        content: "Three days in Jaipur taught us more about India than three weeks of guidebooks ever could.",
        platform: "X",
        status: "PUBLISHED",
        simulated: true,
        publishedAt: daysAgo(3),
      },
      {
        content: "The best travel advice we ever got: plan your first day, wing the rest.",
        platform: "X",
        status: "SCHEDULED",
        simulated: true,
        scheduledFor: daysAgo(-1),
      },
      {
        content: "Draft: a short thread on navigating Delhi's auto-rickshaws without getting overcharged.",
        platform: "X",
        status: "DRAFT",
        simulated: true,
      },
    ],
  });

  console.log("Seeding demo dashboard snapshots (labeled as demo data)...");
  for (let i = 6; i >= 0; i--) {
    await prisma.dailySnapshot.create({
      data: {
        date: daysAgo(i),
        newFollowers: 60 + Math.floor(((7 - i) * 37) % 53),
        waitlistSignups: 8 + Math.floor(((7 - i) * 11) % 17),
        isDemoData: true,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
