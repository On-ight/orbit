-- AlterTable
ALTER TABLE "AccountSocialToken" DROP COLUMN "accessTokenSecret",
ADD COLUMN     "refreshToken" TEXT NOT NULL,
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3) NOT NULL;

