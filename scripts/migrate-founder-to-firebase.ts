// One-time migration: creates a Firebase Auth user for the founder account
// (it predates Firebase — every new signup goes through Firebase first) and
// links it via firebaseUid onto the existing User row. Run this after the
// step-A schema migration (firebaseUid nullable) and before step B (dropping
// passwordHash/tokenVersion, making firebaseUid required).
//
//   FOUNDER_EMAIL=... FOUNDER_PASSWORD=... npm run migrate:founder-firebase

import { PrismaClient } from "@prisma/client";
import { getAdminAuth } from "../lib/firebase/admin";

const prisma = new PrismaClient();

async function main() {
  const FOUNDER_EMAIL = process.env.FOUNDER_EMAIL;
  const FOUNDER_PASSWORD = process.env.FOUNDER_PASSWORD;
  if (!FOUNDER_EMAIL || !FOUNDER_PASSWORD) {
    console.error("Set FOUNDER_EMAIL and FOUNDER_PASSWORD env vars before running this.");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email: FOUNDER_EMAIL } });
  if (!user) {
    console.error(`No existing User row for ${FOUNDER_EMAIL} — run the original backfill first.`);
    process.exit(1);
  }
  if (user.firebaseUid) {
    console.log("Already migrated to Firebase — exiting.");
    return;
  }

  const firebaseUser = await getAdminAuth().createUser({
    email: FOUNDER_EMAIL,
    password: FOUNDER_PASSWORD,
    emailVerified: true,
  });
  console.log("Created Firebase user:", firebaseUser.uid);

  await prisma.user.update({ where: { id: user.id }, data: { firebaseUid: firebaseUser.uid } });
  console.log("Linked User row to Firebase. Log in at /login with:", FOUNDER_EMAIL);
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
