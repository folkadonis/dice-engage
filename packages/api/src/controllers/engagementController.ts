import { FastifyInstance } from "fastify";
import {
    getEngagementSummary,
    getEngagementTimeline,
    getEngagementHeatmap,
    getUserEngagementScore,
    subscribeToWorkspace,
    subscribeToGlobal,
    EVENT_CHANNEL_MAP,
} from "backend-lib/src/engagementTracking";

export default async function engagementController(fastify: FastifyInstance) {
    // ── GET /engagement/summary ─ Channel engagement metrics ─────────
    fastify.get("/summary", async (request, reply) => {
        const {
            workspaceId,
            startDate,
            endDate,
            channel,
            broadcastId,
            journeyId,
        } = request.query as {
            workspaceId: string;
            startDate?: string;
            endDate?: string;
            channel?: string;
            broadcastId?: string;
            journeyId?: string;
        };

        if (!workspaceId) {
            return reply.status(400).send({ error: "workspaceId is required" });
        }

        const summary = await getEngagementSummary(workspaceId, {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            channel,
            broadcastId,
            journeyId,
        });

        return reply.status(200).send(summary);
    });

    // ── GET /engagement/timeline ─ Recent event feed ─────────────────
    fastify.get("/timeline", async (request, reply) => {
        const { workspaceId, limit, channel } = request.query as {
            workspaceId: string;
            limit?: string;
            channel?: string;
        };

        if (!workspaceId) {
            return reply.status(400).send({ error: "workspaceId is required" });
        }

        const events = await getEngagementTimeline(workspaceId, {
            limit: limit ? parseInt(limit, 10) : 50,
            channel,
        });

        return reply.status(200).send({ events });
    });

    // ── GET /engagement/heatmap ─ Engagement by day/hour ─────────────
    fastify.get("/heatmap", async (request, reply) => {
        const { workspaceId, days } = request.query as {
            workspaceId: string;
            days?: string;
        };

        if (!workspaceId) {
            return reply.status(400).send({ error: "workspaceId is required" });
        }

        const heatmap = await getEngagementHeatmap(
            workspaceId,
            days ? parseInt(days, 10) : 7,
        );

        return reply.status(200).send({ heatmap });
    });

    // ── GET /engagement/user/:userId ─ Per-user engagement score ─────
    fastify.get("/user/:userId", async (request, reply) => {
        const { userId } = request.params as { userId: string };
        const { workspaceId } = request.query as { workspaceId: string };

        if (!workspaceId) {
            return reply.status(400).send({ error: "workspaceId is required" });
        }

        const score = await getUserEngagementScore(workspaceId, userId);
        if (!score) {
            return reply.status(404).send({ error: "No engagement data found" });
        }

        return reply.status(200).send(score);
    });

    // ── GET /engagement/channels ─ Available engagement event types ───
    fastify.get("/channels", async (_request, reply) => {
        const channels: Record<string, string[]> = {};

        for (const [, mapping] of Object.entries(EVENT_CHANNEL_MAP)) {
            if (!channels[mapping.channel]) {
                channels[mapping.channel] = [];
            }
            channels[mapping.channel]!.push(mapping.action);
        }

        return reply.status(200).send({ channels });
    });

    // ── GET /engagement/stream ─ SSE real-time event stream ──────────
    fastify.get("/stream", async (request, reply) => {
        const { workspaceId } = request.query as { workspaceId?: string };

        // Set SSE headers
        reply.raw.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        });

        // Send initial connection event
        reply.raw.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date() })}\n\n`);

        // Heartbeat every 15s to keep connection alive
        const heartbeat = setInterval(() => {
            reply.raw.write(`data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date() })}\n\n`);
        }, 15000);

        // Subscribe to events
        const unsubscribe = workspaceId
            ? subscribeToWorkspace(workspaceId, (event) => {
                reply.raw.write(`data: ${JSON.stringify({ type: "engagement", ...event })}\n\n`);
            })
            : subscribeToGlobal((event) => {
                reply.raw.write(`data: ${JSON.stringify({ type: "engagement", ...event })}\n\n`);
            });

        // Clean up on disconnect
        request.raw.on("close", () => {
            clearInterval(heartbeat);
            unsubscribe();
        });

        // Don't call reply.send() — SSE keeps the connection open
        return reply;
    });
}
