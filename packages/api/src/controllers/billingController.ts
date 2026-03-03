/**
 * Analytics & Billing API Controller
 *
 * REST endpoints for tenant usage, billing, and message analytics.
 * Mounted at /api/admin/billing
 */
import { Type } from "@sinclair/typebox";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { FastifyInstance } from "fastify";

import {
    checkPlanLimits,
    getCurrentUsage,
    getMessageAnalytics,
} from "backend-lib/src/billing";

const BadRequestResponse = Type.Object({ message: Type.String() });

export default function billingController(fastify: FastifyInstance) {
    const f = fastify.withTypeProvider<TypeBoxTypeProvider>();

    // GET /usage/:tenantId — Get current billing period usage
    f.get(
        "/usage/:tenantId",
        {
            schema: {
                params: Type.Object({ tenantId: Type.String() }),
                response: {
                    200: Type.Object({
                        tenantId: Type.String(),
                        periodStart: Type.String(),
                        periodEnd: Type.String(),
                        emailCount: Type.Number(),
                        smsCount: Type.Number(),
                        whatsappCount: Type.Number(),
                        pushCount: Type.Number(),
                        webhookCount: Type.Number(),
                        totalMessages: Type.Number(),
                        totalCostMicros: Type.Number(),
                        currency: Type.String(),
                    }),
                    404: BadRequestResponse,
                    500: BadRequestResponse,
                },
            },
        },
        async (request, reply) => {
            const { tenantId } = request.params;
            const result = await getCurrentUsage(tenantId);

            if (result.isErr()) {
                return reply.status(500).send({ message: result.error.message });
            }

            if (!result.value) {
                return reply.status(200).send({
                    tenantId,
                    periodStart: new Date().toISOString(),
                    periodEnd: new Date().toISOString(),
                    emailCount: 0,
                    smsCount: 0,
                    whatsappCount: 0,
                    pushCount: 0,
                    webhookCount: 0,
                    totalMessages: 0,
                    totalCostMicros: 0,
                    currency: "USD",
                });
            }

            return reply.status(200).send({
                ...result.value,
                periodStart: result.value.periodStart.toISOString(),
                periodEnd: result.value.periodEnd.toISOString(),
            });
        },
    );

    // GET /limits/:tenantId — Check plan limits for a channel
    f.get(
        "/limits/:tenantId",
        {
            schema: {
                params: Type.Object({ tenantId: Type.String() }),
                querystring: Type.Object({
                    channel: Type.Optional(Type.String()),
                }),
                response: {
                    200: Type.Object({
                        allowed: Type.Boolean(),
                        currentUsage: Type.Number(),
                        limit: Type.Number(),
                        plan: Type.String(),
                    }),
                    500: BadRequestResponse,
                },
            },
        },
        async (request, reply) => {
            const { tenantId } = request.params;
            const channel = (request.query as { channel?: string }).channel ?? "Email";
            const result = await checkPlanLimits(tenantId, channel);

            if (result.isErr()) {
                return reply.status(500).send({ message: result.error.message });
            }

            return reply.status(200).send(result.value);
        },
    );

    // GET /analytics/:tenantId — Get message analytics with channel breakdown
    f.get(
        "/analytics/:tenantId",
        {
            schema: {
                params: Type.Object({ tenantId: Type.String() }),
                querystring: Type.Object({
                    startDate: Type.Optional(Type.String()),
                    endDate: Type.Optional(Type.String()),
                    workspaceId: Type.Optional(Type.String()),
                }),
                response: {
                    200: Type.Object({
                        channels: Type.Array(
                            Type.Object({
                                channel: Type.String(),
                                count: Type.Number(),
                                costMicros: Type.Number(),
                            }),
                        ),
                    }),
                    500: BadRequestResponse,
                },
            },
        },
        async (request, reply) => {
            const { tenantId } = request.params;
            const query = request.query as {
                startDate?: string;
                endDate?: string;
                workspaceId?: string;
            };

            // Default to current month
            const now = new Date();
            const startDate = query.startDate
                ? new Date(query.startDate)
                : new Date(now.getFullYear(), now.getMonth(), 1);
            const endDate = query.endDate ? new Date(query.endDate) : now;

            const result = await getMessageAnalytics({
                tenantId,
                startDate,
                endDate,
                workspaceId: query.workspaceId,
            });

            if (result.isErr()) {
                return reply.status(500).send({ message: result.error.message });
            }

            return reply.status(200).send({ channels: result.value });
        },
    );
}
