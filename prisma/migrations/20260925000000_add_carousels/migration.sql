-- CreateTable
CREATE TABLE "Carousel" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCRIPT_OPTIONS',
    "title" TEXT,
    "versions" JSONB,
    "selectedVersionIndex" INTEGER,
    "slides" JSONB,
    "slideImageUrls" JSONB,
    "description" TEXT,
    "hashtags" TEXT,
    "sourceTrendId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carousel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Carousel_accountId_status_idx" ON "Carousel"("accountId", "status");

-- AddForeignKey
ALTER TABLE "Carousel" ADD CONSTRAINT "Carousel_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carousel" ADD CONSTRAINT "Carousel_sourceTrendId_fkey" FOREIGN KEY ("sourceTrendId") REFERENCES "TrendInput"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Approval" ADD COLUMN "carouselId" TEXT;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_carouselId_fkey" FOREIGN KEY ("carouselId") REFERENCES "Carousel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
