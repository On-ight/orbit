-- CreateTable
CREATE TABLE "Reel" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "style" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCRIPT_OPTIONS',
    "title" TEXT,
    "versions" JSONB,
    "selectedVersionIndex" INTEGER,
    "script" JSONB,
    "voiceGender" TEXT,
    "voiceTone" TEXT,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "description" TEXT,
    "hashtags" TEXT,
    "creatomateRenderId" TEXT,
    "sourceTrendId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reel_accountId_status_idx" ON "Reel"("accountId", "status");

-- AddForeignKey
ALTER TABLE "Reel" ADD CONSTRAINT "Reel_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reel" ADD CONSTRAINT "Reel_sourceTrendId_fkey" FOREIGN KEY ("sourceTrendId") REFERENCES "TrendInput"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Approval" ADD COLUMN     "reelId" TEXT;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "Reel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
