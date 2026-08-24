-- DropForeignKey
ALTER TABLE "AgentRun" DROP CONSTRAINT "AgentRun_accountId_fkey";

-- DropForeignKey
ALTER TABLE "Approval" DROP CONSTRAINT "Approval_accountId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_accountId_fkey";

-- DropForeignKey
ALTER TABLE "DailySnapshot" DROP CONSTRAINT "DailySnapshot_accountId_fkey";

-- DropForeignKey
ALTER TABLE "KnowledgeBaseEntry" DROP CONSTRAINT "KnowledgeBaseEntry_accountId_fkey";

-- DropForeignKey
ALTER TABLE "MockMention" DROP CONSTRAINT "MockMention_accountId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_accountId_fkey";

-- DropForeignKey
ALTER TABLE "TrendInput" DROP CONSTRAINT "TrendInput_accountId_fkey";

-- DropIndex
DROP INDEX "DailySnapshot_date_key";

-- AlterTable
ALTER TABLE "AgentRun" ALTER COLUMN "accountId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Approval" ALTER COLUMN "accountId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "accountId" SET NOT NULL;

-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "accountId" SET NOT NULL;

-- AlterTable
ALTER TABLE "KnowledgeBaseEntry" ALTER COLUMN "accountId" SET NOT NULL;

-- AlterTable
ALTER TABLE "MockMention" ALTER COLUMN "accountId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "accountId" SET NOT NULL;

-- AlterTable
ALTER TABLE "TrendInput" ALTER COLUMN "accountId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DailySnapshot_accountId_date_key" ON "DailySnapshot"("accountId", "date");

-- AddForeignKey
ALTER TABLE "MockMention" ADD CONSTRAINT "MockMention_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySnapshot" ADD CONSTRAINT "DailySnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendInput" ADD CONSTRAINT "TrendInput_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseEntry" ADD CONSTRAINT "KnowledgeBaseEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

