-- AlterTable
ALTER TABLE "Approval" ADD COLUMN     "platformPostId" TEXT,
ADD COLUMN     "publishedUrl" TEXT,
ADD COLUMN     "publishedVia" TEXT,
ADD COLUMN     "scheduledFor" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "publishedVia" TEXT;
