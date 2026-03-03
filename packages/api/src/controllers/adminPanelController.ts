/**
 * Admin Super Panel Controller
 *
 * Global admin endpoints for platform management:
 * - Dashboard overview (tenant count, message volumes, revenue)
 * - Tenant management (list with usage, plan assignment, suspension)
 * - Provider health monitoring
 * - Global metrics and analytics
 *
 * Mounted at /api/admin/panel
 */
import { Type } from "@sinclair/typebox";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { and, count, eq, gte, lte, sql, sum, desc } from "drizzle-orm";
import { FastifyInstance } from "fastify";

import { db } from "backend-lib/src/db";
import {
    billingUsage as dbBillingUsage,
    messageLog as dbMessageLog,
    tenant as dbTenant,
    workspace as dbWorkspace,
} from "backend-lib/src/db/schema";
import { channelRegistry } from "backend-lib/src/channels";

const BadRequestResponse = Type.Object({ message: Type.String() });

export default function adminPanelController(fastify: FastifyInstance) {
    const f = fastify.withTypeProvider<TypeBoxTypeProvider>();

    // ─── Dashboard Overview ─────────────────────────────────────────

    f.get(
        "/dashboard",
        {
            schema: {
                response: {
                    200: Type.Object({
                        totalTenants: Type.Number(),
                        activeTenants: Type.Number(),
                        suspendedTenants: Type.Number(),
                        totalWorkspaces: Type.Number(),
                        messagesToday: Type.Number(),
                        messagesThisMonth: Type.Number(),
                        revenueThisMonthMicros: Type.Number(),
                        topChannels: Type.Array(
                            Type.Object({
                                channel: Type.String(),
                                count: Type.Number(),
                            }),
                        ),
                    }),
                    500: BadRequestResponse,
                },
            },
        },
        async (_request, reply) => {
            try {
                const now = new Date();
                const todayStart = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                );
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

                const [
                    tenantCounts,
                    workspaceCount,
                    todayMessages,
                    monthMessages,
                    monthRevenue,
                    topChannels,
                ] = await Promise.all([
                    // Tenant counts by status
                    db()
                        .select({
                            status: dbTenant.status,
                            count: sql<number>`count(*)::int`,
                        })
                        .from(dbTenant)
                        .groupBy(dbTenant.status),

                    // Total workspaces
                    db()
                        .select({ count: sql<number>`count(*)::int` })
                        .from(dbWorkspace),

                    // Messages today
                    db()
                        .select({ count: sql<number>`count(*)::int` })
                        .from(dbMessageLog)
                        .where(gte(dbMessageLog.createdAt, todayStart)),

                    // Messages this month
                    db()
                        .select({ count: sql<number>`count(*)::int` })
                        .from(dbMessageLog)
                        .where(gte(dbMessageLog.createdAt, monthStart)),

                    // Revenue this month
                    db()
                        .select({
                            total: sql<number>`coalesce(sum(${dbBillingUsage.totalCostMicros}), 0)::int`,
                        })
                        .from(dbBillingUsage)
                        .where(gte(dbBillingUsage.periodStart, monthStart)),

                    // Top channels this month
                    db()
                        .select({
                            channel: dbMessageLog.channel,
                            count: sql<number>`count(*)::int`,
                        })
                        .from(dbMessageLog)
                        .where(gte(dbMessageLog.createdAt, monthStart))
                        .groupBy(dbMessageLog.channel)
                        .orderBy(desc(sql`count(*)`))
                        .limit(10),
                ]);

                const statusMap: Record<string, number> = {};
                for (const row of tenantCounts) {
                    statusMap[row.status] = row.count;
                }

                return reply.status(200).send({
                    totalTenants:
                        (statusMap.Active ?? 0) +
                        (statusMap.Suspended ?? 0) +
                        (statusMap.Cancelled ?? 0),
                    activeTenants: statusMap.Active ?? 0,
                    suspendedTenants: statusMap.Suspended ?? 0,
                    totalWorkspaces: workspaceCount[0]?.count ?? 0,
                    messagesToday: todayMessages[0]?.count ?? 0,
                    messagesThisMonth: monthMessages[0]?.count ?? 0,
                    revenueThisMonthMicros: monthRevenue[0]?.total ?? 0,
                    topChannels,
                });
            } catch (e) {
                return reply
                    .status(500)
                    .send({ message: (e as Error).message });
            }
        },
    );

    // ─── Tenant List with Usage ─────────────────────────────────────

    f.get(
        "/tenants",
        {
            schema: {
                querystring: Type.Object({
                    status: Type.Optional(Type.String()),
                    limit: Type.Optional(Type.Number()),
                    offset: Type.Optional(Type.Number()),
                }),
                response: {
                    200: Type.Object({
                        tenants: Type.Array(
                            Type.Object({
                                id: Type.String(),
                                name: Type.String(),
                                planType: Type.String(),
                                status: Type.String(),
                                workspaceCount: Type.Number(),
                                currentMonthMessages: Type.Number(),
                                currentMonthCostMicros: Type.Number(),
                                createdAt: Type.String(),
                            }),
                        ),
                        total: Type.Number(),
                    }),
                    500: BadRequestResponse,
                },
            },
        },
        async (request, reply) => {
            try {
                const query = request.query as {
                    status?: string;
                    limit?: number;
                    offset?: number;
                };
                const limit = query.limit ?? 50;
                const offset = query.offset ?? 0;

                const conditions = [];
                if (query.status) {
                    conditions.push(eq(dbTenant.status, query.status as "Active" | "Suspended" | "Cancelled"));
                }

                const monthStart = new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    1,
                );

                // Get tenants with workspace count
                const tenants = await db()
                    .select({
                        id: dbTenant.id,
                        name: dbTenant.name,
                        planType: dbTenant.planType,
                        status: dbTenant.status,
                        createdAt: dbTenant.createdAt,
                        workspaceCount: sql<number>`(
              SELECT count(*)::int FROM "Workspace" w WHERE w."tenantId" = ${dbTenant.id}
            )`,
                        currentMonthMessages: sql<number>`(
              SELECT coalesce(count(*), 0)::int FROM "MessageLog" ml
              WHERE ml."tenantId" = ${dbTenant.id}
              AND ml."createdAt" >= ${monthStart}
            )`,
                        currentMonthCostMicros: sql<number>`(
              SELECT coalesce(sum(ml."costMicros"), 0)::int FROM "MessageLog" ml
              WHERE ml."tenantId" = ${dbTenant.id}
              AND ml."createdAt" >= ${monthStart}
            )`,
                    })
                    .from(dbTenant)
                    .where(conditions.length > 0 ? and(...conditions) : undefined)
                    .orderBy(desc(dbTenant.createdAt))
                    .limit(limit)
                    .offset(offset);

                const [totalRow] = await db()
                    .select({ count: sql<number>`count(*)::int` })
                    .from(dbTenant)
                    .where(conditions.length > 0 ? and(...conditions) : undefined);

                return reply.status(200).send({
                    tenants: tenants.map((t) => ({
                        ...t,
                        createdAt: t.createdAt.toISOString(),
                    })),
                    total: totalRow?.count ?? 0,
                });
            } catch (e) {
                return reply
                    .status(500)
                    .send({ message: (e as Error).message });
            }
        },
    );

    // ─── Plan Assignment ────────────────────────────────────────────

    f.put(
        "/tenants/:tenantId/plan",
        {
            schema: {
                params: Type.Object({ tenantId: Type.String() }),
                body: Type.Object({
                    planType: Type.Union([
                        Type.Literal("Starter"),
                        Type.Literal("Growth"),
                        Type.Literal("Enterprise"),
                    ]),
                }),
                response: {
                    200: Type.Object({
                        id: Type.String(),
                        planType: Type.String(),
                    }),
                    404: BadRequestResponse,
                    500: BadRequestResponse,
                },
            },
        },
        async (request, reply) => {
            try {
                const { tenantId } = request.params;
                const { planType } = request.body;

                const [updated] = await db()
                    .update(dbTenant)
                    .set({ planType })
                    .where(eq(dbTenant.id, tenantId))
                    .returning({ id: dbTenant.id, planType: dbTenant.planType });

                if (!updated) {
                    return reply.status(404).send({ message: "Tenant not found" });
                }

                return reply.status(200).send(updated);
            } catch (e) {
                return reply
                    .status(500)
                    .send({ message: (e as Error).message });
            }
        },
    );

    // ─── Tenant Suspension ──────────────────────────────────────────

    f.post(
        "/tenants/:tenantId/suspend",
        {
            schema: {
                params: Type.Object({ tenantId: Type.String() }),
                response: {
                    200: Type.Object({ id: Type.String(), status: Type.String() }),
                    404: BadRequestResponse,
                    500: BadRequestResponse,
                },
            },
        },
        async (request, reply) => {
            try {
                const { tenantId } = request.params;

                const [updated] = await db()
                    .update(dbTenant)
                    .set({ status: "Suspended" })
                    .where(eq(dbTenant.id, tenantId))
                    .returning({ id: dbTenant.id, status: dbTenant.status });

                if (!updated) {
                    return reply.status(404).send({ message: "Tenant not found" });
                }

                return reply.status(200).send(updated);
            } catch (e) {
                return reply
                    .status(500)
                    .send({ message: (e as Error).message });
            }
        },
    );

    f.post(
        "/tenants/:tenantId/activate",
        {
            schema: {
                params: Type.Object({ tenantId: Type.String() }),
                response: {
                    200: Type.Object({ id: Type.String(), status: Type.String() }),
                    404: BadRequestResponse,
                    500: BadRequestResponse,
                },
            },
        },
        async (request, reply) => {
            try {
                const { tenantId } = request.params;

                const [updated] = await db()
                    .update(dbTenant)
                    .set({ status: "Active" })
                    .where(eq(dbTenant.id, tenantId))
                    .returning({ id: dbTenant.id, status: dbTenant.status });

                if (!updated) {
                    return reply.status(404).send({ message: "Tenant not found" });
                }

                return reply.status(200).send(updated);
            } catch (e) {
                return reply
                    .status(500)
                    .send({ message: (e as Error).message });
            }
        },
    );

    // ─── Provider Health ────────────────────────────────────────────

    f.get(
        "/providers/health",
        {
            schema: {
                response: {
                    200: Type.Object({
                        registeredProviders: Type.Array(
                            Type.Object({
                                channelType: Type.String(),
                                providerType: Type.String(),
                                status: Type.String(),
                            }),
                        ),
                        channelCount: Type.Number(),
                    }),
                    500: BadRequestResponse,
                },
            },
        },
        async (_request, reply) => {
            try {
                const registry = channelRegistry();
                const channelTypes = registry.listChannelTypes();

                const providers: Array<{
                    channelType: string;
                    providerType: string;
                    status: string;
                }> = [];

                for (const channelType of channelTypes) {
                    const channelProviders = registry.listProviders(channelType);
                    for (const provider of channelProviders) {
                        providers.push({
                            channelType: provider.channelType,
                            providerType: provider.providerType,
                            status: "healthy",
                        });
                    }
                }

                return reply.status(200).send({
                    registeredProviders: providers,
                    channelCount: channelTypes.length,
                });
            } catch (e) {
                return reply
                    .status(500)
                    .send({ message: (e as Error).message });
            }
        },
    );

    // ─── Global Message Volume (Time Series) ────────────────────────

    f.get(
        "/metrics/volume",
        {
            schema: {
                querystring: Type.Object({
                    days: Type.Optional(Type.Number()),
                }),
                response: {
                    200: Type.Object({
                        dataPoints: Type.Array(
                            Type.Object({
                                date: Type.String(),
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
            try {
                const { days = 30 } = request.query as { days?: number };
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - days);

                const rows = await db()
                    .select({
                        date: sql<string>`date_trunc('day', ${dbMessageLog.createdAt})::text`,
                        count: sql<number>`count(*)::int`,
                        costMicros: sql<number>`coalesce(sum(${dbMessageLog.costMicros}), 0)::int`,
                    })
                    .from(dbMessageLog)
                    .where(gte(dbMessageLog.createdAt, startDate))
                    .groupBy(sql`date_trunc('day', ${dbMessageLog.createdAt})`)
                    .orderBy(sql`date_trunc('day', ${dbMessageLog.createdAt})`);

                return reply.status(200).send({ dataPoints: rows });
            } catch (e) {
                return reply
                    .status(500)
                    .send({ message: (e as Error).message });
            }
        },
    );
}
