CREATE TYPE "public"."TenantStatus" AS ENUM('Active', 'Suspended', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."TenantPlanType" AS ENUM('Starter', 'Growth', 'Enterprise');--> statement-breakpoint
CREATE TABLE "Tenant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"planType" "TenantPlanType" DEFAULT 'Starter' NOT NULL,
	"status" "TenantStatus" DEFAULT 'Active' NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Brand" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" uuid NOT NULL,
	"name" text NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"senderConfigJson" jsonb,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Workspace" ADD COLUMN "tenantId" uuid;--> statement-breakpoint
ALTER TABLE "Workspace" ADD COLUMN "brandId" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "Tenant_name_key" ON "Tenant" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "Brand_tenantId_name_key" ON "Brand" USING btree ("tenantId","name");--> statement-breakpoint
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."Brand"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TYPE "public"."DBChannelType" ADD VALUE IF NOT EXISTS 'WhatsApp';
