-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "cycleMode" TEXT NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3);

