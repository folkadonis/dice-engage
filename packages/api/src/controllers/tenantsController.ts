import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import {
    createTenant,
    getTenant,
    listTenants,
    updateTenant,
    suspendTenant,
    activateTenant,
    deleteTenant,
    assignWorkspaceToTenant,
} from "backend-lib/src/tenants";
import {
    createBrand,
    getBrand,
    listBrands,
    updateBrand,
    deleteBrand,
} from "backend-lib/src/brands";
import { FastifyInstance } from "fastify";
import {
    TenantResource,
    UpsertTenantResource,
    BrandResource,
    UpsertBrandResource,
    EmptyResponse,
} from "isomorphic-lib/src/types";

// eslint-disable-next-line @typescript-eslint/require-await
export default async function tenantsController(fastify: FastifyInstance) {
    // ─── Tenant CRUD ─────────────────────────────────────────────────

    fastify.withTypeProvider<TypeBoxTypeProvider>().post(
        "/",
        {
            schema: {
                description: "Create a new tenant",
                tags: ["Tenants"],
                body: UpsertTenantResource,
                response: {
                    201: TenantResource,
                    400: Type.Object({ message: Type.String() }),
                },
            },
        },
        async (request, reply) => {
            const result = await createTenant(request.body);
            if (result.isErr()) {
                return reply.status(400).send({ message: result.error.message });
            }
            return reply.status(201).send(result.value);
        },
    );

    fastify.withTypeProvider<TypeBoxTypeProvider>().get(
        "/",
        {
            schema: {
                description: "List all tenants",
                tags: ["Tenants"],
                querystring: Type.Object({
                    status: Type.Optional(Type.String()),
                }),
                response: {
                    200: Type.Array(TenantResource),
                },
            },
        },
        async (request, reply) => {
            const tenants = await listTenants({
                status: request.query.status as "Active" | "Suspended" | "Cancelled" | undefined,
            });
            return reply.status(200).send(tenants);
        },
    );

    fastify.withTypeProvider<TypeBoxTypeProvider>().get(
        "/:tenantId",
        {
            schema: {
                description: "Get a tenant by ID",
                tags: ["Tenants"],
                params: Type.Object({
                    tenantId: Type.String(),
                }),
                response: {
                    200: TenantResource,
                    404: Type.Object({ message: Type.String() }),
                },
            },
        },
        async (request, reply) => {
            const tenant = await getTenant(request.params.tenantId);
            if (!tenant) {
                return reply.status(404).send({ message: "Tenant not found" });
            }
            return reply.status(200).send(tenant);
        },
    );

    fastify.withTypeProvider<TypeBoxTypeProvider>().put(
        "/:tenantId",
        {
            schema: {
                description: "Update a tenant",
                tags: ["Tenants"],
                params: Type.Object({
                    tenantId: Type.String(),
                }),
                body: Type.Partial(UpsertTenantResource),
                response: {
                    200: TenantResource,
                    400: Type.Object({ message: Type.String() }),
                },
            },
        },
        async (request, reply) => {
            const result = await updateTenant(request.params.tenantId, request.body);
            if (result.isErr()) {
                return reply.status(400).send({ message: result.error.message });
            }
            return reply.status(200).send(result.value);
        },
    );

    fastify.withTypeProvider<TypeBoxTypeProvider>().post(
        "/:tenantId/suspend",
        {
            schema: {
                description: "Suspend a tenant",
                tags: ["Tenants"],
                params: Type.Object({
                    tenantId: Type.String(),
                }),
                response: {
                    200: TenantResource,
                    400: Type.Object({ message: Type.String() }),
                },
            },
        },
        async (request, reply) => {
            const result = await suspendTenant(request.params.tenantId);
            if (result.isErr()) {
                return reply.status(400).send({ message: result.error.message });
            }
            return reply.status(200).send(result.value);
        },
    );

    fastify.withTypeProvider<TypeBoxTypeProvider>().post(
        "/:tenantId/activate",
        {
            schema: {
                description: "Activate a suspended tenant",
                tags: ["Tenants"],
                params: Type.Object({
                    tenantId: Type.String(),
                }),
                response: {
                    200: TenantResource,
                    400: Type.Object({ message: Type.String() }),
                },
            },
        },
        async (request, reply) => {
            const result = await activateTenant(request.params.tenantId);
            if (result.isErr()) {
                return reply.status(400).send({ message: result.error.message });
            }
            return reply.status(200).send(result.value);
        },
    );

    fastify.withTypeProvider<TypeBoxTypeProvider>().delete(
        "/:tenantId",
        {
            schema: {
                description: "Delete a tenant",
                tags: ["Tenants"],
                params: Type.Object({
                    tenantId: Type.String(),
                }),
                response: {
                    204: EmptyResponse,
                    400: Type.Object({ message: Type.String() }),
                },
            },
        },
        async (request, reply) => {
            const result = await deleteTenant(request.params.tenantId);
            if (result.isErr()) {
                return reply.status(400).send({ message: result.error.message });
            }
            return reply.status(204).send();
        },
    );

    // ─── Workspace-Tenant Assignment ────────────────────────────────

    fastify.withTypeProvider<TypeBoxTypeProvider>().post(
        "/:tenantId/workspaces",
        {
            schema: {
                description: "Assign a workspace to a tenant",
                tags: ["Tenants"],
                params: Type.Object({
                    tenantId: Type.String(),
                }),
                body: Type.Object({
                    workspaceId: Type.String(),
                    brandId: Type.Optional(Type.String()),
                }),
                response: {
                    204: EmptyResponse,
                    400: Type.Object({ message: Type.String() }),
                },
            },
        },
        async (request, reply) => {
            const result = await assignWorkspaceToTenant({
                tenantId: request.params.tenantId,
                workspaceId: request.body.workspaceId,
                brandId: request.body.brandId,
            });
            if (result.isErr()) {
                return reply.status(400).send({ message: result.error.message });
            }
            return reply.status(204).send();
        },
    );

    // ─── Brand CRUD (nested under tenants) ──────────────────────────

    fastify.withTypeProvider<TypeBoxTypeProvider>().post(
        "/:tenantId/brands",
        {
            schema: {
                description: "Create a brand under a tenant",
                tags: ["Tenants", "Brands"],
                params: Type.Object({
                    tenantId: Type.String(),
                }),
                body: Type.Object({
                    name: Type.String(),
                    timezone: Type.Optional(Type.String()),
                    senderConfigJson: Type.Optional(Type.Unknown()),
                }),
                response: {
                    201: BrandResource,
                    400: Type.Object({ message: Type.String() }),
                },
            },
        },
        async (request, reply) => {
            const result = await createBrand({
                tenantId: request.params.tenantId,
                name: request.body.name,
                timezone: request.body.timezone,
                senderConfigJson: request.body.senderConfigJson,
            });
            if (result.isErr()) {
                return reply.status(400).send({ message: result.error.message });
            }
            return reply.status(201).send(result.value);
        },
    );

    fastify.withTypeProvider<TypeBoxTypeProvider>().get(
        "/:tenantId/brands",
        {
            schema: {
                description: "List brands for a tenant",
                tags: ["Tenants", "Brands"],
                params: Type.Object({
                    tenantId: Type.String(),
                }),
                response: {
                    200: Type.Array(BrandResource),
                },
            },
        },
        async (request, reply) => {
            const brands = await listBrands({ tenantId: request.params.tenantId });
            return reply.status(200).send(brands);
        },
    );

    fastify.withTypeProvider<TypeBoxTypeProvider>().put(
        "/:tenantId/brands/:brandId",
        {
            schema: {
                description: "Update a brand",
                tags: ["Tenants", "Brands"],
                params: Type.Object({
                    tenantId: Type.String(),
                    brandId: Type.String(),
                }),
                body: Type.Object({
                    name: Type.Optional(Type.String()),
                    timezone: Type.Optional(Type.String()),
                    senderConfigJson: Type.Optional(Type.Unknown()),
                }),
                response: {
                    200: BrandResource,
                    400: Type.Object({ message: Type.String() }),
                },
            },
        },
        async (request, reply) => {
            const result = await updateBrand(request.params.brandId, request.body);
            if (result.isErr()) {
                return reply.status(400).send({ message: result.error.message });
            }
            return reply.status(200).send(result.value);
        },
    );

    fastify.withTypeProvider<TypeBoxTypeProvider>().delete(
        "/:tenantId/brands/:brandId",
        {
            schema: {
                description: "Delete a brand",
                tags: ["Tenants", "Brands"],
                params: Type.Object({
                    tenantId: Type.String(),
                    brandId: Type.String(),
                }),
                response: {
                    204: EmptyResponse,
                    400: Type.Object({ message: Type.String() }),
                },
            },
        },
        async (request, reply) => {
            const result = await deleteBrand(request.params.brandId);
            if (result.isErr()) {
                return reply.status(400).send({ message: result.error.message });
            }
            return reply.status(204).send();
        },
    );
}
