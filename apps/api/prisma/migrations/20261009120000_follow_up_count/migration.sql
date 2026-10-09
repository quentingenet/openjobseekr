-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "followUpCount" INTEGER NOT NULL DEFAULT 0;

-- Same range as the shared FOLLOW_UP_COUNT (@openjobseekr/domain). Keep both in sync.
ALTER TABLE "Application"
  ADD CONSTRAINT "Application_followUpCount_range" CHECK ("followUpCount" BETWEEN 0 AND 99);
