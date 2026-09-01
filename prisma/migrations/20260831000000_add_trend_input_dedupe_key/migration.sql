-- AlterTable
ALTER TABLE "TrendInput" ADD COLUMN     "dedupeKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TrendInput_accountId_dedupeKey_key" ON "TrendInput"("accountId", "dedupeKey");
