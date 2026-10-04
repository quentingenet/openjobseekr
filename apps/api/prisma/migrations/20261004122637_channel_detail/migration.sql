-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "channelDetail" TEXT;

-- Same limit as the API (TEXT_LIMITS.short); only meaningful when "channel" is OTHER.
ALTER TABLE "Application"
  ADD CONSTRAINT "Application_channelDetail_length" CHECK (char_length("channelDetail") <= 200);
