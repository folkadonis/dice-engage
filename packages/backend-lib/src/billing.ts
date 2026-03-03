/**
 * Billing Service
 *
 * Handles message cost tracking, usage aggregation, and plan-based limits.
 * Records each outbound message in `messageLog` and maintains running
 * totals in `billingUsage` per tenant billing period.
 */
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { err, ok, Result } from "neverthrow";

import { db } from "./db";
import {
    billingUsage as dbBillingUsage,
    messageLog as dbMessageLog,
    tenant as dbTenant,
} from "./db/schema";
import logger from "./logger";

// ─── Cost Constants (in micros — 1 USD = 1_000_000 micros) ─────────

const CHANNEL_COSTS: Record<string, number> = {
    Email: 100,        // $0.0001
    Sms: 7500,         // $0.0075
    WhatsApp: 5000,    // $0.005
    MobilePush: 50,    // $0.00005
    WebPush: 10,       // $0.00001
    Webhook: 100,      // $0.0001
    RCS: 10000,        // $0.01
};

// ─── Plan Limits ────────────────────────────────────────────────────

const PLAN_LIMITS: Record<string, {
    monthlyMessages: number;
    monthlyEmailLimit: number;
    monthlySmsLimit: number;
}> = {
    Starter: {
        monthlyMessages: 10_000,
        monthlyEmailLimit: 10_000,
        monthlySmsLimit: 1_000,
    },
    Growth: {
        monthlyMessages: 100_000,
        monthlyEmailLimit: 100_000,
        monthlySmsLimit: 10_000,
    },
    Enterprise: {
        monthlyMessages: Infinity,
        monthlyEmailLimit: Infinity,
        monthlySmsLimit: Infinity,
    },
};

// ─── Log a Message Send ─────────────────────────────────────────────

export interface LogMessageParams {
    tenantId: string;
    workspaceId: string;
    brandId?: string;
    channel: string;
    provider: string;
    status?: string;
    recipientId?: string;
    messageExternalId?: string;
    metadata?: Record<string, unknown>;
}

export async function logMessageSend(
    params: LogMessageParams,
): Promise<Result<{ id: string; cost: number }, Error>> {
    const costMicros = CHANNEL_COSTS[params.channel] ?? 100;

    try {
        const [row] = await db()
            .insert(dbMessageLog)
            .values({
                tenantId: params.tenantId,
                workspaceId: params.workspaceId,
                brandId: params.brandId,
                channel: params.channel,
                provider: params.provider,
                status: params.status ?? "sent",
                recipientId: params.recipientId,
                costMicros,
                messageExternalId: params.messageExternalId,
                metadata: params.metadata,
            })
            .returning({ id: dbMessageLog.id });

        if (!row) {
            return err(new Error("Failed to insert message log"));
        }

        // Increment billing usage for current period
        await incrementBillingUsage(params.tenantId, params.channel, costMicros);

        return ok({ id: row.id, cost: costMicros });
    } catch (e) {
        const error = e as Error;
        logger().error({ err: error, ...params }, "Failed to log message send");
        return err(error);
    }
}

// ─── Billing Usage ──────────────────────────────────────────────────

function getCurrentPeriod(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
}

const CHANNEL_TO_COLUMN: Record<string, string> = {
    Email: "emailCount",
    Sms: "smsCount",
    WhatsApp: "whatsappCount",
    MobilePush: "pushCount",
    WebPush: "pushCount",
    Webhook: "webhookCount",
};

async function incrementBillingUsage(
    tenantId: string,
    channel: string,
    costMicros: number,
): Promise<void> {
    const { start, end } = getCurrentPeriod();
    const columnName = CHANNEL_TO_COLUMN[channel] ?? "webhookCount";

    try {
        // Upsert: insert if no record for this period, else increment
        await db()
            .insert(dbBillingUsage)
            .values({
                tenantId,
                periodStart: start,
                periodEnd: end,
                emailCount: channel === "Email" ? 1 : 0,
                smsCount: channel === "Sms" ? 1 : 0,
                whatsappCount: channel === "WhatsApp" ? 1 : 0,
                pushCount: channel === "MobilePush" || channel === "WebPush" ? 1 : 0,
                webhookCount: channel === "Webhook" ? 1 : 0,
                totalCostMicros: costMicros,
            })
            .onConflictDoUpdate({
                target: [dbBillingUsage.tenantId, dbBillingUsage.periodStart],
                set: {
                    [columnName]: sql`${sql.identifier("BillingUsage")}.${sql.identifier(columnName)} + 1`,
                    totalCostMicros: sql`${sql.identifier("BillingUsage")}."totalCostMicros" + ${costMicros}`,
                },
            });
    } catch (e) {
        logger().error(
            { err: e, tenantId, channel },
            "Failed to increment billing usage",
        );
    }
}

// ─── Usage Queries ──────────────────────────────────────────────────

export interface UsageSummary {
    tenantId: string;
    periodStart: Date;
    periodEnd: Date;
    emailCount: number;
    smsCount: number;
    whatsappCount: number;
    pushCount: number;
    webhookCount: number;
    totalMessages: number;
    totalCostMicros: number;
    currency: string;
}

export async function getCurrentUsage(
    tenantId: string,
): Promise<Result<UsageSummary | null, Error>> {
    const { start, end } = getCurrentPeriod();

    try {
        const row = await db().query.billingUsage.findFirst({
            where: and(
                eq(dbBillingUsage.tenantId, tenantId),
                gte(dbBillingUsage.periodStart, start),
                lte(dbBillingUsage.periodEnd, end),
            ),
        });

        if (!row) {
            return ok(null);
        }

        return ok({
            tenantId: row.tenantId,
            periodStart: row.periodStart,
            periodEnd: row.periodEnd,
            emailCount: row.emailCount,
            smsCount: row.smsCount,
            whatsappCount: row.whatsappCount,
            pushCount: row.pushCount,
            webhookCount: row.webhookCount,
            totalMessages:
                row.emailCount +
                row.smsCount +
                row.whatsappCount +
                row.pushCount +
                row.webhookCount,
            totalCostMicros: row.totalCostMicros,
            currency: row.currency,
        });
    } catch (e) {
        return err(e as Error);
    }
}

// ─── Plan Limit Checks ──────────────────────────────────────────────

export interface LimitCheckResult {
    allowed: boolean;
    currentUsage: number;
    limit: number;
    plan: string;
}

export async function checkPlanLimits(
    tenantId: string,
    channel: string,
): Promise<Result<LimitCheckResult, Error>> {
    try {
        const tenantRow = await db().query.tenant.findFirst({
            where: eq(dbTenant.id, tenantId),
        });

        if (!tenantRow) {
            return err(new Error("Tenant not found"));
        }

        const plan = tenantRow.planType;
        const limits = PLAN_LIMITS[plan];
        if (!limits) {
            return err(new Error(`Unknown plan: ${plan}`));
        }

        const usageResult = await getCurrentUsage(tenantId);
        if (usageResult.isErr()) {
            return err(usageResult.error);
        }

        const usage = usageResult.value;
        const totalMessages = usage
            ? usage.emailCount +
            usage.smsCount +
            usage.whatsappCount +
            usage.pushCount +
            usage.webhookCount
            : 0;

        return ok({
            allowed: totalMessages < limits.monthlyMessages,
            currentUsage: totalMessages,
            limit: limits.monthlyMessages,
            plan,
        });
    } catch (e) {
        return err(e as Error);
    }
}

// ─── Analytics Queries ──────────────────────────────────────────────

export interface ChannelBreakdown {
    channel: string;
    count: number;
    costMicros: number;
}

export async function getMessageAnalytics(params: {
    tenantId: string;
    startDate: Date;
    endDate: Date;
    workspaceId?: string;
}): Promise<Result<ChannelBreakdown[], Error>> {
    try {
        const conditions = [
            eq(dbMessageLog.tenantId, params.tenantId),
            gte(dbMessageLog.createdAt, params.startDate),
            lte(dbMessageLog.createdAt, params.endDate),
        ];

        if (params.workspaceId) {
            conditions.push(eq(dbMessageLog.workspaceId, params.workspaceId));
        }

        const rows = await db()
            .select({
                channel: dbMessageLog.channel,
                count: sql<number>`count(*)::int`,
                costMicros: sql<number>`sum(${dbMessageLog.costMicros})::int`,
            })
            .from(dbMessageLog)
            .where(and(...conditions))
            .groupBy(dbMessageLog.channel);

        return ok(rows);
    } catch (e) {
        return err(e as Error);
    }
}
