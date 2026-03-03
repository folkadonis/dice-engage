-- ═══════════════════════════════════════════════════════════════════
-- Dice Engage — Complete Database Schema Migration
-- Generated from packages/backend-lib/src/db/schema.ts
-- Target: Neon PostgreSQL
-- ═══════════════════════════════════════════════════════════════════

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUM TYPES ─────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "ComputedPropertyType" AS ENUM ('Segment', 'UserProperty');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DBBroadcastStatus" AS ENUM ('NotStarted', 'InProgress', 'Triggered');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DBBroadcastStatusV2" AS ENUM ('Draft', 'Scheduled', 'Running', 'Paused', 'Completed', 'Cancelled', 'Failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DBBroadcastVersion" AS ENUM ('V1', 'V2');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DBChannelType" AS ENUM ('Email', 'MobilePush', 'Sms', 'Webhook', 'WhatsApp');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DBCompletionStatus" AS ENUM ('NotStarted', 'InProgress', 'Successful', 'Failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DBResourceType" AS ENUM ('Declarative', 'Internal');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DBRoleType" AS ENUM ('Admin', 'WorkspaceManager', 'Author', 'Viewer');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DBSubscriptionGroupType" AS ENUM ('OptIn', 'OptOut');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DBWorkspaceOccupantType" AS ENUM ('WorkspaceMember', 'ChildWorkspaceOccupant');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "JourneyStatus" AS ENUM ('NotStarted', 'Running', 'Paused', 'Broadcast');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SegmentStatus" AS ENUM ('NotStarted', 'Running', 'Paused');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "UserPropertyStatus" AS ENUM ('NotStarted', 'Running', 'Paused');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DBUserPropertyIndexType" AS ENUM ('String', 'Number', 'Date');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "WorkspaceStatus" AS ENUM ('Active', 'Tombstoned', 'Paused');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "WorkspaceType" AS ENUM ('Root', 'Child', 'Parent');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TenantStatus" AS ENUM ('Active', 'Suspended', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TenantPlanType" AS ENUM ('Starter', 'Growth', 'Enterprise');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ─── TABLES (ordered by dependency) ─────────────────────────────────

-- 1. Tenant (no FK deps)
CREATE TABLE IF NOT EXISTS "Tenant" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" TEXT NOT NULL,
  "planType" "TenantPlanType" NOT NULL DEFAULT 'Starter',
  "status" "TenantStatus" NOT NULL DEFAULT 'Active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_name_key" ON "Tenant" USING btree ("name" ASC NULLS LAST);

-- 2. Brand (FK → Tenant)
CREATE TABLE IF NOT EXISTS "Brand" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenantId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "senderConfigJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "Brand_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Brand_tenantId_name_key" ON "Brand" USING btree ("tenantId" ASC NULLS LAST, "name" ASC NULLS LAST);

-- 3. WorkspaceMember (no FK deps except self-ref → Workspace set later)
CREATE TABLE IF NOT EXISTS "WorkspaceMember" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "image" TEXT,
  "name" TEXT,
  "nickname" TEXT,
  "lastWorkspaceId" UUID
);
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceMember_email_key" ON "WorkspaceMember" USING btree ("email" ASC NULLS LAST);

-- 4. Workspace (FK → Tenant, Brand)
CREATE TABLE IF NOT EXISTS "Workspace" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "domain" TEXT,
  "type" "WorkspaceType" NOT NULL DEFAULT 'Root',
  "externalId" TEXT,
  "parentWorkspaceId" UUID,
  "status" "WorkspaceStatus" NOT NULL DEFAULT 'Active',
  "tenantId" UUID,
  "brandId" UUID,
  CONSTRAINT "Workspace_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Workspace_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "Workspace_parentWorkspaceId_externalId_key" ON "Workspace" ("parentWorkspaceId", "externalId");
CREATE UNIQUE INDEX IF NOT EXISTS "Workspace_parentWorkspaceId_name_key" ON "Workspace" ("parentWorkspaceId", "name") NULLS NOT DISTINCT;

-- Add deferred FK for WorkspaceMember → Workspace
ALTER TABLE "WorkspaceMember" DROP CONSTRAINT IF EXISTS "WorkspaceMember_lastWorkspaceId_fkey";
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_lastWorkspaceId_fkey"
  FOREIGN KEY ("lastWorkspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE SET NULL;

-- 5. MessageLog (FK → Tenant, Workspace)
CREATE TABLE IF NOT EXISTS "MessageLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenantId" UUID NOT NULL,
  "brandId" UUID,
  "workspaceId" UUID NOT NULL,
  "channel" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'sent',
  "recipientId" TEXT,
  "costMicros" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "messageExternalId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "MessageLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "MessageLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "MessageLog_tenantId_idx" ON "MessageLog" USING btree ("tenantId" ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS "MessageLog_workspaceId_idx" ON "MessageLog" USING btree ("workspaceId" ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS "MessageLog_createdAt_idx" ON "MessageLog" USING btree ("createdAt" ASC NULLS LAST);

-- 6. BillingUsage (FK → Tenant)
CREATE TABLE IF NOT EXISTS "BillingUsage" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenantId" UUID NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "emailCount" INTEGER NOT NULL DEFAULT 0,
  "smsCount" INTEGER NOT NULL DEFAULT 0,
  "whatsappCount" INTEGER NOT NULL DEFAULT 0,
  "pushCount" INTEGER NOT NULL DEFAULT 0,
  "webhookCount" INTEGER NOT NULL DEFAULT 0,
  "totalCostMicros" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "BillingUsage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "BillingUsage_tenantId_period_key" ON "BillingUsage" USING btree ("tenantId" ASC NULLS LAST, "periodStart" ASC NULLS LAST);

-- 7. SegmentIOConfiguration (FK → Workspace)
CREATE TABLE IF NOT EXISTS "SegmentIOConfiguration" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "sharedSecret" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "SegmentIOConfiguration_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "SegmentIOConfiguration_workspaceId_key" ON "SegmentIOConfiguration" USING btree ("workspaceId" ASC NULLS LAST);

-- 8. UserProperty (FK → Workspace)
CREATE TABLE IF NOT EXISTS "UserProperty" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "definition" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "resourceType" "DBResourceType" NOT NULL DEFAULT 'Declarative',
  "definitionUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "status" "UserPropertyStatus" NOT NULL DEFAULT 'Running',
  "exampleValue" TEXT,
  CONSTRAINT "UserProperty_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserProperty_workspaceId_name_key" ON "UserProperty" USING btree ("workspaceId" ASC NULLS LAST, "name" ASC NULLS LAST);

-- 9. UserPropertyAssignment (FK → Workspace, UserProperty)
CREATE TABLE IF NOT EXISTS "UserPropertyAssignment" (
  "userId" TEXT NOT NULL,
  "userPropertyId" UUID NOT NULL,
  "value" TEXT NOT NULL,
  "workspaceId" UUID NOT NULL,
  CONSTRAINT "UserPropertyAssignment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "UserPropertyAssignment_userPropertyId_fkey" FOREIGN KEY ("userPropertyId") REFERENCES "UserProperty"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "UserPropertyAssignment_userId_idx" ON "UserPropertyAssignment" USING btree ("userId" ASC NULLS LAST);
CREATE UNIQUE INDEX IF NOT EXISTS "UserPropertyAssignment_workspaceId_userPropertyId_userId_key" ON "UserPropertyAssignment" USING btree ("workspaceId" ASC NULLS LAST, "userPropertyId" ASC NULLS LAST, "userId" ASC NULLS LAST);

-- 10. Secret (FK → Workspace)
CREATE TABLE IF NOT EXISTS "Secret" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "value" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "configValue" JSONB,
  CONSTRAINT "Secret_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Secret_workspaceId_name_key" ON "Secret" USING btree ("workspaceId" ASC NULLS LAST, "name" ASC NULLS LAST);

-- 11. EmailProvider (FK → Workspace, Secret)
CREATE TABLE IF NOT EXISTS "EmailProvider" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "apiKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "secretId" UUID,
  CONSTRAINT "EmailProvider_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "EmailProvider_secretId_fkey" FOREIGN KEY ("secretId") REFERENCES "Secret"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "EmailProvider_workspaceId_type_key" ON "EmailProvider" USING btree ("workspaceId" ASC NULLS LAST, "type" ASC NULLS LAST);

-- 12. DefaultEmailProvider (FK → Workspace, EmailProvider)
CREATE TABLE IF NOT EXISTS "DefaultEmailProvider" (
  "workspaceId" UUID NOT NULL,
  "emailProviderId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "fromAddress" TEXT,
  CONSTRAINT "DefaultEmailProvider_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "DefaultEmailProvider_emailProviderId_fkey" FOREIGN KEY ("emailProviderId") REFERENCES "EmailProvider"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "DefaultEmailProvider_workspaceId_key" ON "DefaultEmailProvider" USING btree ("workspaceId" ASC NULLS LAST);

-- 13. SmsProvider (FK → Workspace, Secret)
CREATE TABLE IF NOT EXISTS "SmsProvider" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "secretId" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "SmsProvider_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "SmsProvider_secretId_fkey" FOREIGN KEY ("secretId") REFERENCES "Secret"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "SmsProvider_workspaceId_type_key" ON "SmsProvider" USING btree ("workspaceId" ASC NULLS LAST, "type" ASC NULLS LAST);

-- 14. DefaultSmsProvider (FK → Workspace, SmsProvider)
CREATE TABLE IF NOT EXISTS "DefaultSmsProvider" (
  "workspaceId" UUID NOT NULL,
  "smsProviderId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "DefaultSmsProvider_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "DefaultSmsProvider_smsProviderId_fkey" FOREIGN KEY ("smsProviderId") REFERENCES "SmsProvider"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "DefaultSmsProvider_workspaceId_key" ON "DefaultSmsProvider" USING btree ("workspaceId" ASC NULLS LAST);

-- 15. WhatsappProvider (FK → Workspace, Secret)
CREATE TABLE IF NOT EXISTS "WhatsappProvider" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "secretId" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "WhatsappProvider_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "WhatsappProvider_secretId_fkey" FOREIGN KEY ("secretId") REFERENCES "Secret"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "WhatsappProvider_workspaceId_type_key" ON "WhatsappProvider" USING btree ("workspaceId" ASC NULLS LAST, "type" ASC NULLS LAST);

-- 16. DefaultWhatsappProvider (FK → Workspace, WhatsappProvider)
CREATE TABLE IF NOT EXISTS "DefaultWhatsappProvider" (
  "workspaceId" UUID NOT NULL,
  "whatsappProviderId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "DefaultWhatsappProvider_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "DefaultWhatsappProvider_whatsappProviderId_fkey" FOREIGN KEY ("whatsappProviderId") REFERENCES "WhatsappProvider"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "DefaultWhatsappProvider_workspaceId_key" ON "DefaultWhatsappProvider" USING btree ("workspaceId" ASC NULLS LAST);

-- 17. SubscriptionGroup (FK → Workspace)
CREATE TABLE IF NOT EXISTS "SubscriptionGroup" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "type" "DBSubscriptionGroupType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "channel" "DBChannelType" NOT NULL,
  CONSTRAINT "SubscriptionGroup_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SubscriptionGroup_workspaceId_idx" ON "SubscriptionGroup" USING btree ("workspaceId" ASC NULLS LAST);
CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionGroup_workspaceId_name_key" ON "SubscriptionGroup" USING btree ("workspaceId" ASC NULLS LAST, "name" ASC NULLS LAST);

-- 18. Segment (FK → Workspace, SubscriptionGroup)
CREATE TABLE IF NOT EXISTS "Segment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "definition" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "resourceType" "DBResourceType" NOT NULL DEFAULT 'Declarative',
  "subscriptionGroupId" UUID,
  "status" "SegmentStatus" NOT NULL DEFAULT 'Running',
  "definitionUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "Segment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "Segment_subscriptionGroupId_fkey" FOREIGN KEY ("subscriptionGroupId") REFERENCES "SubscriptionGroup"("id") ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "Segment_resourceType_idx" ON "Segment" USING btree ("resourceType" ASC NULLS LAST);
CREATE UNIQUE INDEX IF NOT EXISTS "Segment_workspaceId_name_key" ON "Segment" USING btree ("workspaceId" ASC NULLS LAST, "name" ASC NULLS LAST);

-- 19. SegmentAssignment (FK → Workspace, Segment)
CREATE TABLE IF NOT EXISTS "SegmentAssignment" (
  "userId" TEXT NOT NULL,
  "inSegment" BOOLEAN NOT NULL,
  "workspaceId" UUID NOT NULL,
  "segmentId" UUID NOT NULL,
  CONSTRAINT "SegmentAssignment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "SegmentAssignment_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "SegmentAssignment_workspaceId_userId_segmentId_key" ON "SegmentAssignment" USING btree ("workspaceId" ASC NULLS LAST, "userId" ASC NULLS LAST, "segmentId" ASC NULLS LAST);

-- 20. MessageTemplate (FK → Workspace)
CREATE TABLE IF NOT EXISTS "MessageTemplate" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "definition" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "resourceType" "DBResourceType" NOT NULL DEFAULT 'Declarative',
  "draft" JSONB,
  CONSTRAINT "MessageTemplate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "MessageTemplate_workspaceId_name_key" ON "MessageTemplate" USING btree ("workspaceId" ASC NULLS LAST, "name" ASC NULLS LAST);

-- 21. Journey (FK → Workspace)
CREATE TABLE IF NOT EXISTS "Journey" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "status" "JourneyStatus" NOT NULL DEFAULT 'NotStarted',
  "definition" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "resourceType" "DBResourceType" NOT NULL DEFAULT 'Declarative',
  "canRunMultiple" BOOLEAN NOT NULL DEFAULT false,
  "draft" JSONB,
  "statusUpdatedAt" TIMESTAMP(3),
  CONSTRAINT "Journey_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Journey_workspaceId_name_key" ON "Journey" USING btree ("workspaceId" ASC NULLS LAST, "name" ASC NULLS LAST);

-- 22. Broadcast (FK → Workspace, Segment, Journey, MessageTemplate)
CREATE TABLE IF NOT EXISTS "Broadcast" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "triggeredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "journeyId" UUID,
  "messageTemplateId" UUID,
  "segmentId" UUID,
  "subscriptionGroupId" UUID,
  "status" "DBBroadcastStatus" DEFAULT 'NotStarted',
  "statusV2" "DBBroadcastStatusV2" DEFAULT 'Draft',
  "scheduledAt" TIMESTAMP(3),
  "version" "DBBroadcastVersion" DEFAULT 'V1',
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "config" JSONB,
  CONSTRAINT "Broadcast_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT "Broadcast_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Broadcast_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Broadcast_messageTemplateId_fkey" FOREIGN KEY ("messageTemplateId") REFERENCES "MessageTemplate"("id") ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "Broadcast_workspaceId_name_key" ON "Broadcast" USING btree ("workspaceId" ASC NULLS LAST, "name" ASC NULLS LAST);

-- 23. EmailTemplate (FK → Workspace)
CREATE TABLE IF NOT EXISTS "EmailTemplate" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "from" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "replyTo" TEXT,
  CONSTRAINT "EmailTemplate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE
);

-- 24. UserJourneyEvent (no explicit FK in schema)
CREATE TABLE IF NOT EXISTS "UserJourneyEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" TEXT NOT NULL,
  "journeyId" UUID,
  "type" TEXT NOT NULL,
  "journeyStartedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "nodeId" TEXT,
  "eventKey" TEXT,
  "eventKeyName" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserJourneyEvent_journeyId_userId_eventKey_eventKeyName_typ_key"
  ON "UserJourneyEvent" USING btree (
    "journeyId" ASC NULLS LAST,
    "userId" ASC NULLS LAST,
    "eventKey" ASC NULLS LAST,
    "eventKeyName" ASC NULLS LAST,
    "type" ASC NULLS LAST,
    "journeyStartedAt" ASC NULLS LAST,
    "nodeId" ASC NULLS LAST
  );

-- 25. Integration (FK → Workspace)
CREATE TABLE IF NOT EXISTS "Integration" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "definition" JSONB NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "definitionUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "Integration_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Integration_workspaceId_name_key" ON "Integration" USING btree ("workspaceId" ASC NULLS LAST, "name" ASC NULLS LAST);

-- 26. WriteKey (FK → Workspace, Secret)
CREATE TABLE IF NOT EXISTS "WriteKey" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "secretId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "WriteKey_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "WriteKey_secretId_fkey" FOREIGN KEY ("secretId") REFERENCES "Secret"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "WriteKey_workspaceId_secretId_key" ON "WriteKey" USING btree ("workspaceId" ASC NULLS LAST, "secretId" ASC NULLS LAST);

-- 27. OauthToken (FK → Workspace)
CREATE TABLE IF NOT EXISTS "OauthToken" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "refreshToken" TEXT NOT NULL,
  "accessToken" TEXT NOT NULL,
  "expiresIn" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "OauthToken_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "OauthToken_workspaceId_name_key" ON "OauthToken" USING btree ("workspaceId" ASC NULLS LAST, "name" ASC NULLS LAST);

-- 28. WorkspaceMemberRole (FK → Workspace, WorkspaceMember)
CREATE TABLE IF NOT EXISTS "WorkspaceMemberRole" (
  "workspaceId" UUID NOT NULL,
  "workspaceMemberId" UUID NOT NULL,
  "role" "DBRoleType" NOT NULL DEFAULT 'Viewer',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "WorkspaceMemberRole_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "WorkspaceMemberRole_workspaceMemberId_fkey" FOREIGN KEY ("workspaceMemberId") REFERENCES "WorkspaceMember"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceMemberRole_workspaceId_workspaceMemberId_key" ON "WorkspaceMemberRole" USING btree ("workspaceId" ASC NULLS LAST, "workspaceMemberId" ASC NULLS LAST);

-- 29. WorkspaceMembeAccount (FK → WorkspaceMember)
CREATE TABLE IF NOT EXISTS "WorkspaceMembeAccount" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceMemberId" UUID NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "WorkspaceMembeAccount_workspaceMemberId_fkey" FOREIGN KEY ("workspaceMemberId") REFERENCES "WorkspaceMember"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceMembeAccount_provider_providerAccountId_key" ON "WorkspaceMembeAccount" USING btree ("provider" ASC NULLS LAST, "providerAccountId" ASC NULLS LAST);

-- 30. ComputedPropertyPeriod (FK → Workspace)
CREATE TABLE IF NOT EXISTS "ComputedPropertyPeriod" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "type" "ComputedPropertyType" NOT NULL,
  "computedPropertyId" UUID NOT NULL,
  "version" TEXT NOT NULL,
  "from" TIMESTAMP(3),
  "to" TIMESTAMP(3) NOT NULL,
  "step" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "ComputedPropertyPeriod_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ComputedPropertyPeriod_workspaceId_type_computedPropertyId__idx"
  ON "ComputedPropertyPeriod" USING btree (
    "workspaceId" ASC NULLS LAST,
    "type" ASC NULLS LAST,
    "computedPropertyId" ASC NULLS LAST,
    "to" ASC NULLS LAST
  );

-- 31. AdminApiKey (FK → Workspace, Secret)
CREATE TABLE IF NOT EXISTS "AdminApiKey" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "secretId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "AdminApiKey_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "AdminApiKey_secretId_fkey" FOREIGN KEY ("secretId") REFERENCES "Secret"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "AdminApiKey_workspaceId_name_key" ON "AdminApiKey" USING btree ("workspaceId" ASC NULLS LAST, "name" ASC NULLS LAST);

-- 32. Feature (FK → Workspace)
CREATE TABLE IF NOT EXISTS "Feature" (
  "workspaceId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "config" JSONB,
  CONSTRAINT "Feature_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Feature_workspaceId_name_key" ON "Feature" USING btree ("workspaceId" ASC NULLS LAST, "name" ASC NULLS LAST);

-- 33. WorkspaceRelation (deprecated, FK → Workspace x2)
CREATE TABLE IF NOT EXISTS "WorkspaceRelation" (
  "parentWorkspaceId" UUID NOT NULL,
  "childWorkspaceId" UUID NOT NULL,
  CONSTRAINT "WorkspaceRelation_parentWorkspaceId_fkey" FOREIGN KEY ("parentWorkspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "WorkspaceRelation_childWorkspaceId_fkey" FOREIGN KEY ("childWorkspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceRelation_parentWorkspaceId_childWorkspaceId_key" ON "WorkspaceRelation" USING btree ("parentWorkspaceId" ASC NULLS LAST, "childWorkspaceId" ASC NULLS LAST);

-- 34. ComponentConfiguration (FK → Workspace)
CREATE TABLE IF NOT EXISTS "ComponentConfiguration" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "definition" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "ComponentConfiguration_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ComponentConfiguration_workspaceId_name_key" ON "ComponentConfiguration" USING btree ("workspaceId" ASC NULLS LAST, "name" ASC NULLS LAST);

-- 35. WorkspaceOccupantSetting (FK → Workspace, Secret)
CREATE TABLE IF NOT EXISTS "WorkspaceOccupantSetting" (
  "workspaceId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "workspaceOccupantId" TEXT NOT NULL,
  "occupantType" "DBWorkspaceOccupantType" NOT NULL,
  "config" JSONB,
  "secretId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "WorkspaceOccupantSetting_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "WorkspaceOccupantSetting_secretId_fkey" FOREIGN KEY ("secretId") REFERENCES "Secret"("id") ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceOccupantSetting_workspaceId_occupantId_name_key" ON "WorkspaceOccupantSetting" USING btree ("workspaceId" ASC NULLS LAST, "workspaceOccupantId" ASC NULLS LAST, "name" ASC NULLS LAST);

-- 36. UserPropertyIndex (FK → Workspace, UserProperty)
CREATE TABLE IF NOT EXISTS "UserPropertyIndex" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "userPropertyId" UUID NOT NULL,
  "type" "DBUserPropertyIndexType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "UserPropertyIndex_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "UserPropertyIndex_userPropertyId_fkey" FOREIGN KEY ("userPropertyId") REFERENCES "UserProperty"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserPropertyIndex_userPropertyId_key" ON "UserPropertyIndex" USING btree ("userPropertyId" ASC NULLS LAST);

-- 37. SubscriptionManagementTemplate (FK → Workspace)
CREATE TABLE IF NOT EXISTS "SubscriptionManagementTemplate" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspaceId" UUID NOT NULL,
  "template" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "SubscriptionManagementTemplate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionManagementTemplate_workspaceId_key" ON "SubscriptionManagementTemplate" USING btree ("workspaceId" ASC NULLS LAST);

-- ═══════════════════════════════════════════════════════════════════
-- Migration complete. 18 enums + 37 tables created.
-- ═══════════════════════════════════════════════════════════════════
