// One-off: loads the OnSight knowledge base entries into the database.
// Safe to re-run — upserts by title, so editing knowledge-base.ts and
// re-running updates existing entries instead of duplicating them.
//
//   npm run kb:seed

import { PrismaClient } from "@prisma/client";
import { SEED_KNOWLEDGE_BASE } from "../lib/db/seed-data/knowledge-base";

const prisma = new PrismaClient();

async function main() {
  for (const entry of SEED_KNOWLEDGE_BASE) {
    const existing = await prisma.knowledgeBaseEntry.findFirst({ where: { title: entry.title } });
    if (existing) {
      await prisma.knowledgeBaseEntry.update({ where: { id: existing.id }, data: { content: entry.content } });
      console.log(`Updated: ${entry.title}`);
    } else {
      await prisma.knowledgeBaseEntry.create({ data: entry });
      console.log(`Created: ${entry.title}`);
    }
  }
  console.log(`\nDone — ${SEED_KNOWLEDGE_BASE.length} knowledge base entries in place.`);
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
