-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('CAREER_SITE', 'LINKEDIN', 'WELCOME_TO_THE_JUNGLE', 'HELLOWORK', 'APEC', 'RECRUITMENT_AGENCY', 'UNSOLICITED', 'REFERRAL', 'OTHER');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('SENT', 'RESPONSE_RECEIVED', 'HR_INTERVIEW', 'TECHNICAL_INTERVIEW', 'OFFER', 'REJECTED', 'NO_RESPONSE');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('ONSITE', 'HYBRID', 'FULL_REMOTE', 'UNSPECIFIED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sentAt" DATE NOT NULL,
    "company" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "location" TEXT,
    "response" TEXT,
    "resources" TEXT,
    "channel" "Channel",
    "status" "Status" NOT NULL DEFAULT 'SENT',
    "contact" TEXT,
    "workMode" "WorkMode",
    "remoteRhythm" TEXT,
    "salaryRange" TEXT,
    "cvVersion" TEXT,
    "stack" TEXT,
    "recruitmentProcess" TEXT,
    "notes" TEXT,
    "jobPostingText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "level" INTEGER,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Application_userId_status_idx" ON "Application"("userId", "status");

-- CreateIndex
CREATE INDEX "Application_userId_channel_idx" ON "Application"("userId", "channel");

-- CreateIndex
CREATE INDEX "Application_userId_sentAt_idx" ON "Application"("userId", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_userId_name_key" ON "Skill"("userId", "name");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
