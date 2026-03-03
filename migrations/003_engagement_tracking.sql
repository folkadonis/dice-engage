-- Migration: Add engagement tracking columns to MessageLog
-- Adds delivery lifecycle columns and indexes for real-time engagement queries

-- Add engagement lifecycle columns
ALTER TABLE "MessageLog" ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3);
ALTER TABLE "MessageLog" ADD COLUMN IF NOT EXISTS "openedAt" TIMESTAMP(3);
ALTER TABLE "MessageLog" ADD COLUMN IF NOT EXISTS "clickedAt" TIMESTAMP(3);
ALTER TABLE "MessageLog" ADD COLUMN IF NOT EXISTS "failedAt" TIMESTAMP(3);
ALTER TABLE "MessageLog" ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;
ALTER TABLE "MessageLog" ADD COLUMN IF NOT EXISTS "broadcastId" UUID;
ALTER TABLE "MessageLog" ADD COLUMN IF NOT EXISTS "journeyId" UUID;
ALTER TABLE "MessageLog" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "MessageLog" ADD COLUMN IF NOT EXISTS "messageId" TEXT;

-- Indexes for engagement queries
CREATE INDEX IF NOT EXISTS "MessageLog_status_idx"
  ON "MessageLog" USING btree ("status");

CREATE INDEX IF NOT EXISTS "MessageLog_channel_createdAt_idx"
  ON "MessageLog" USING btree ("channel", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "MessageLog_userId_idx"
  ON "MessageLog" USING btree ("userId");

CREATE INDEX IF NOT EXISTS "MessageLog_broadcastId_idx"
  ON "MessageLog" USING btree ("broadcastId");
