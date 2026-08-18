-- AlterTable
ALTER TABLE "Approval" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "TrendInput" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'SEED';

-- CreateTable
CREATE TABLE "KnowledgeBaseEntry" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBaseEntry_pkey" PRIMARY KEY ("id")
);
