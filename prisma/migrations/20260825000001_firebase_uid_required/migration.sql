-- AlterTable
ALTER TABLE "User" DROP COLUMN "passwordHash",
DROP COLUMN "tokenVersion",
ALTER COLUMN "firebaseUid" SET NOT NULL;

