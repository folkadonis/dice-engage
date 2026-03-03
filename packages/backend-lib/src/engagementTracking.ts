import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "./db";
import { EventEmitter } from "events";

// ─── In-Memory Real-Time Event Bus ──────────────────────────────────
// For production, replace with Redis Pub/Sub or Kafka
const engagementBus = new EventEmitter();
engagementBus.setMaxListeners(100);

export interface EngagementEvent {
    id: string;
    workspaceId: string;
    userId?: string;
    channel: string;
    eventType: string;
    messageId?: string;
    broadcastId?: string;
    journeyId?: string;
    metadata?: Record<string, unknown>;
    timestamp: Date;
}

// ─── Emit engagement event (called by webhook handlers / workers) ───
export function emitEngagementEvent(event: EngagementEvent) {
    engagementBus.emit(`workspace:${event.workspaceId}`, event);
    engagementBus.emit("global", event);
}

// ─── Subscribe to real-time events (for SSE) ────────────────────────
export function subscribeToWorkspace(
    workspaceId: string,
    callback: (event: EngagementEvent) => void,
): () => void {
    engagementBus.on(`workspace:${workspaceId}`, callback);
    return () => engagementBus.off(`workspace:${workspaceId}`, callback);
}

export function subscribeToGlobal(
    callback: (event: EngagementEvent) => void,
): () => void {
    engagementBus.on("global", callback);
    return () => engagementBus.off("global", callback);
}

// ─── Channel-level engagement metrics ───────────────────────────────
export interface ChannelEngagementMetrics {
    channel: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
    bounced: number;
    spam: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
}

export function calculateRates(metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
}): { deliveryRate: number; openRate: number; clickRate: number } {
    return {
        deliveryRate: metrics.sent > 0 ? (metrics.delivered / metrics.sent) * 100 : 0,
        openRate: metrics.delivered > 0 ? (metrics.opened / metrics.delivered) * 100 : 0,
        clickRate: metrics.opened > 0 ? (metrics.clicked / metrics.opened) * 100 : 0,
    };
}

// ─── Event type → channel + action mapping ──────────────────────────
export const EVENT_CHANNEL_MAP: Record<string, { channel: string; action: string }> = {
    // Email
    DFEmailDelivered: { channel: "Email", action: "delivered" },
    DFEmailOpened: { channel: "Email", action: "opened" },
    DFEmailClicked: { channel: "Email", action: "clicked" },
    DFEmailBounced: { channel: "Email", action: "bounced" },
    DFEmailDropped: { channel: "Email", action: "dropped" },
    DFEmailMarkedSpam: { channel: "Email", action: "spam" },
    // SMS
    DFSmsDelivered: { channel: "SMS", action: "delivered" },
    DFSmsFailed: { channel: "SMS", action: "failed" },
    DFSmsClicked: { channel: "SMS", action: "clicked" },
    // WhatsApp
    DFWhatsAppDelivered: { channel: "WhatsApp", action: "delivered" },
    DFWhatsAppRead: { channel: "WhatsApp", action: "read" },
    DFWhatsAppReplied: { channel: "WhatsApp", action: "replied" },
    DFWhatsAppFailed: { channel: "WhatsApp", action: "failed" },
    // Push
    DFPushDelivered: { channel: "Push", action: "delivered" },
    DFPushClicked: { channel: "Push", action: "clicked" },
    DFPushDismissed: { channel: "Push", action: "dismissed" },
    DFPushFailed: { channel: "Push", action: "failed" },
    // Webhook
    DFWebhookDelivered: { channel: "Webhook", action: "delivered" },
    DFWebhookFailed: { channel: "Webhook", action: "failed" },
    // General
    DFInternalMessageSent: { channel: "All", action: "sent" },
    DFMessageFailure: { channel: "All", action: "failed" },
    DFMessageSkipped: { channel: "All", action: "skipped" },
};

// ─── Aggregate engagement from message_log table ────────────────────
export async function getEngagementSummary(
    workspaceId: string,
    options?: {
        startDate?: Date;
        endDate?: Date;
        channel?: string;
        broadcastId?: string;
        journeyId?: string;
    },
) {
    const startDate = options?.startDate ?? new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = options?.endDate ?? new Date();

    // Query the message_log table for engagement events
    const results = await db().execute(sql`
    SELECT
      "channel",
      COUNT(*) FILTER (WHERE "status" = 'sent') AS "sent",
      COUNT(*) FILTER (WHERE "status" = 'delivered') AS "delivered",
      COUNT(*) FILTER (WHERE "status" = 'opened') AS "opened",
      COUNT(*) FILTER (WHERE "status" = 'clicked') AS "clicked",
      COUNT(*) FILTER (WHERE "status" = 'failed') AS "failed",
      COUNT(*) FILTER (WHERE "status" = 'bounced') AS "bounced",
      COUNT(*) FILTER (WHERE "status" = 'spam') AS "spam"
    FROM "MessageLog"
    WHERE "workspaceId" = ${workspaceId}
      AND "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
      ${options?.channel ? sql`AND "channel" = ${options.channel}` : sql``}
      ${options?.broadcastId ? sql`AND "broadcastId" = ${options.broadcastId}` : sql``}
    GROUP BY "channel"
    ORDER BY "channel"
  `);

    const channels: ChannelEngagementMetrics[] = (results.rows as any[]).map((row: any) => {
        const sent = Number(row.sent || 0);
        const delivered = Number(row.delivered || 0);
        const opened = Number(row.opened || 0);
        const clicked = Number(row.clicked || 0);
        const rates = calculateRates({ sent, delivered, opened, clicked });

        return {
            channel: row.channel,
            sent,
            delivered,
            opened,
            clicked,
            failed: Number(row.failed || 0),
            bounced: Number(row.bounced || 0),
            spam: Number(row.spam || 0),
            ...rates,
        };
    });

    // Calculate totals
    const totals = channels.reduce(
        (acc, ch) => ({
            sent: acc.sent + ch.sent,
            delivered: acc.delivered + ch.delivered,
            opened: acc.opened + ch.opened,
            clicked: acc.clicked + ch.clicked,
            failed: acc.failed + ch.failed,
            bounced: acc.bounced + ch.bounced,
            spam: acc.spam + ch.spam,
        }),
        { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0, bounced: 0, spam: 0 },
    );

    const totalRates = calculateRates(totals);

    return {
        period: { startDate, endDate },
        channels,
        totals: { ...totals, ...totalRates },
    };
}

// ─── Timeline: recent events as a feed ──────────────────────────────
export async function getEngagementTimeline(
    workspaceId: string,
    options?: { limit?: number; channel?: string },
) {
    const limit = options?.limit ?? 50;

    const results = await db().execute(sql`
    SELECT
      "id", "userId", "channel", "status", "messageId",
      "broadcastId", "createdAt", "metadata"
    FROM "MessageLog"
    WHERE "workspaceId" = ${workspaceId}
      ${options?.channel ? sql`AND "channel" = ${options.channel}` : sql``}
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `);

    return results.rows;
}

// ─── Engagement heatmap: events grouped by hour ─────────────────────
export async function getEngagementHeatmap(
    workspaceId: string,
    days: number = 7,
) {
    const startDate = new Date(new Date().setDate(new Date().getDate() - days));

    const results = await db().execute(sql`
    SELECT
      EXTRACT(DOW FROM "createdAt") AS "dayOfWeek",
      EXTRACT(HOUR FROM "createdAt") AS "hour",
      COUNT(*) AS "eventCount",
      COUNT(*) FILTER (WHERE "status" = 'opened') AS "opens",
      COUNT(*) FILTER (WHERE "status" = 'clicked') AS "clicks"
    FROM "MessageLog"
    WHERE "workspaceId" = ${workspaceId}
      AND "createdAt" >= ${startDate}
    GROUP BY EXTRACT(DOW FROM "createdAt"), EXTRACT(HOUR FROM "createdAt")
    ORDER BY "dayOfWeek", "hour"
  `);

    return results.rows;
}

// ─── Per-user engagement score ──────────────────────────────────────
export async function getUserEngagementScore(
    workspaceId: string,
    userId: string,
) {
    const results = await db().execute(sql`
    SELECT
      COUNT(*) AS "totalMessages",
      COUNT(*) FILTER (WHERE "status" = 'delivered') AS "delivered",
      COUNT(*) FILTER (WHERE "status" = 'opened') AS "opened",
      COUNT(*) FILTER (WHERE "status" = 'clicked') AS "clicked",
      MAX("createdAt") AS "lastEngagement"
    FROM "MessageLog"
    WHERE "workspaceId" = ${workspaceId}
      AND "userId" = ${userId}
  `);

    const row = (results.rows as any[])[0];
    if (!row) return null;

    const total = Number(row.totalMessages || 0);
    const opened = Number(row.opened || 0);
    const clicked = Number(row.clicked || 0);

    // Engagement score: weighted formula (0-100)
    // Opens are worth 1 point, clicks are worth 3 points
    const rawScore = total > 0 ? ((opened * 1 + clicked * 3) / (total * 4)) * 100 : 0;
    const score = Math.min(100, Math.round(rawScore));

    let level: "cold" | "warm" | "hot" | "on_fire";
    if (score >= 75) level = "on_fire";
    else if (score >= 50) level = "hot";
    else if (score >= 25) level = "warm";
    else level = "cold";

    return {
        userId,
        score,
        level,
        totalMessages: total,
        opened,
        clicked,
        lastEngagement: row.lastEngagement,
    };
}
