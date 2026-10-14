-- CreateTable
CREATE TABLE "InstagramInsight" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "likes" INTEGER,
    "comments" INTEGER,
    "reach" INTEGER,
    "saved" INTEGER,
    "shares" INTEGER,
    "totalInteractions" INTEGER,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstagramInsight_approvalId_key" ON "InstagramInsight"("approvalId");

-- CreateIndex
CREATE INDEX "InstagramInsight_accountId_idx" ON "InstagramInsight"("accountId");

-- AddForeignKey
ALTER TABLE "InstagramInsight" ADD CONSTRAINT "InstagramInsight_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramInsight" ADD CONSTRAINT "InstagramInsight_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "Approval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
