-- Migration: Ad-hoc Lists Feature
-- Adds AdhocList and AdhocListRecipient tables for ad-hoc send functionality

-- Enum for list status
DO $$ BEGIN
  CREATE TYPE "AdhocListStatus" AS ENUM ('Draft', 'Ready', 'Sending', 'Sent', 'Failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Ad-hoc list table
CREATE TABLE IF NOT EXISTS "AdhocList" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "status" "AdhocListStatus" DEFAULT 'Draft' NOT NULL,
  "recipientCount" INTEGER DEFAULT 0 NOT NULL,
  "channel" TEXT,
  "templateId" UUID,
  "broadcastId" UUID,
  "savedForReuse" BOOLEAN DEFAULT false NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,

  CONSTRAINT "AdhocList_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "AdhocList_workspaceId_idx"
  ON "AdhocList" USING btree ("workspaceId" ASC NULLS LAST);

-- Ad-hoc list recipient table
CREATE TABLE IF NOT EXISTS "AdhocListRecipient" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "listId" UUID NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "firstName" TEXT,
  "lastName" TEXT,
  "properties" JSONB,
  "status" TEXT DEFAULT 'pending' NOT NULL,
  "sentAt" TIMESTAMP(3),
  "error" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,

  CONSTRAINT "AdhocListRecipient_listId_fkey"
    FOREIGN KEY ("listId") REFERENCES "AdhocList"("id")
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "AdhocListRecipient_listId_idx"
  ON "AdhocListRecipient" USING btree ("listId" ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS "AdhocListRecipient_email_idx"
  ON "AdhocListRecipient" USING btree ("email" ASC NULLS LAST);

-- Auto-update trigger for updatedAt on AdhocList
CREATE OR REPLACE FUNCTION update_adhoclist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_adhoclist_updated_at ON "AdhocList";
CREATE TRIGGER trigger_adhoclist_updated_at
  BEFORE UPDATE ON "AdhocList"
  FOR EACH ROW
  EXECUTE FUNCTION update_adhoclist_updated_at();
