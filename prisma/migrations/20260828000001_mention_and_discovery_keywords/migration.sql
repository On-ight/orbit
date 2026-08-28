-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_sourceMentionId_fkey";

-- DropForeignKey
ALTER TABLE "MockMention" DROP CONSTRAINT "MockMention_accountId_fkey";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "discoveryKeywords" TEXT;

-- DropTable
DROP TABLE "MockMention";

-- CreateTable
CREATE TABLE "Mention" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'X',
    "platformPostId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "matchedKeyword" TEXT,
    "authorHandle" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Mention_accountId_idx" ON "Mention"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Mention_accountId_platformPostId_key" ON "Mention"("accountId", "platformPostId");

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_sourceMentionId_fkey" FOREIGN KEY ("sourceMentionId") REFERENCES "Mention"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

