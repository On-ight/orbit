-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "agentCycleTimeSlot" TEXT NOT NULL DEFAULT '06:00',
ADD COLUMN     "autoApproveMode" BOOLEAN NOT NULL DEFAULT false;

