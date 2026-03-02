import { and, eq, SQL } from "drizzle-orm";
import { err, ok, Result } from "neverthrow";

import { db, insert, queryResult, QueryError } from "./db";
import {
    tenant as dbTenant,
    workspace as dbWorkspace,
} from "./db/schema";
import {
    TenantResource,
    UpsertTenantResource,
} from "isomorphic-lib/src/types";

// ─── Tenant Type from DB ─────────────────────────────────────────────
type Tenant = typeof dbTenant.$inferSelect;

function toTenantResource(tenant: Tenant): TenantResource {
    return {
        id: tenant.id,
        name: tenant.name,
        planType: tenant.planType,
        status: tenant.status,
        createdAt: tenant.createdAt.toISOString(),
        updatedAt: tenant.updatedAt.toISOString(),
    };
}

// ─── Create Tenant ───────────────────────────────────────────────────
export async function createTenant(
    data: UpsertTenantResource,
): Promise<Result<TenantResource, QueryError>> {
    const result = await insert({
        table: dbTenant,
        values: {
            ...(data.id ? { id: data.id } : {}),
            name: data.name,
            ...(data.planType ? { planType: data.planType } : {}),
            ...(data.status ? { status: data.status } : {}),
        },
    });

    if (result.isErr()) {
        return err(result.error);
    }

    return ok(toTenantResource(result.value));
}

// ─── Get Tenant by ID ────────────────────────────────────────────────
export async function getTenant(
    tenantId: string,
): Promise<TenantResource | null> {
    const result = await db().query.tenant.findFirst({
        where: eq(dbTenant.id, tenantId),
    });

    if (!result) {
        return null;
    }

    return toTenantResource(result);
}

// ─── List Tenants ────────────────────────────────────────────────────
export async function listTenants(params?: {
    status?: string;
}): Promise<TenantResource[]> {
    const conditions: SQL[] = [];

    if (params?.status) {
        conditions.push(
            eq(
                dbTenant.status,
                params.status as "Active" | "Suspended" | "Cancelled",
            ),
        );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const tenants = await db().query.tenant.findMany({
        where,
        orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    return tenants.map(toTenantResource);
}

// ─── Update Tenant ───────────────────────────────────────────────────
export async function updateTenant(
    tenantId: string,
    data: Partial<Pick<UpsertTenantResource, "name" | "planType" | "status">>,
): Promise<Result<TenantResource, QueryError>> {
    const updateValues: Record<string, unknown> = {};

    if (data.name !== undefined) updateValues.name = data.name;
    if (data.planType !== undefined) updateValues.planType = data.planType;
    if (data.status !== undefined) updateValues.status = data.status;

    const result = await queryResult(
        db()
            .update(dbTenant)
            .set(updateValues)
            .where(eq(dbTenant.id, tenantId))
            .returning(),
    );

    if (result.isErr()) {
        return err(result.error);
    }

    const updated = result.value[0];
    if (!updated) {
        return err(new Error("Tenant not found") as unknown as QueryError);
    }

    return ok(toTenantResource(updated));
}

// ─── Suspend Tenant ──────────────────────────────────────────────────
export async function suspendTenant(
    tenantId: string,
): Promise<Result<TenantResource, QueryError>> {
    return updateTenant(tenantId, { status: "Suspended" });
}

// ─── Activate Tenant ─────────────────────────────────────────────────
export async function activateTenant(
    tenantId: string,
): Promise<Result<TenantResource, QueryError>> {
    return updateTenant(tenantId, { status: "Active" });
}

// ─── Delete Tenant ───────────────────────────────────────────────────
export async function deleteTenant(
    tenantId: string,
): Promise<Result<void, QueryError>> {
    const result = await queryResult(
        db().delete(dbTenant).where(eq(dbTenant.id, tenantId)),
    );

    if (result.isErr()) {
        return err(result.error);
    }

    return ok(undefined);
}

// ─── Assign Workspace to Tenant ──────────────────────────────────────
export async function assignWorkspaceToTenant({
    workspaceId,
    tenantId,
    brandId,
}: {
    workspaceId: string;
    tenantId: string;
    brandId?: string;
}): Promise<Result<void, QueryError>> {
    const updateValues: Record<string, unknown> = { tenantId };
    if (brandId) {
        updateValues.brandId = brandId;
    }

    const result = await queryResult(
        db()
            .update(dbWorkspace)
            .set(updateValues)
            .where(eq(dbWorkspace.id, workspaceId)),
    );

    if (result.isErr()) {
        return err(result.error);
    }

    return ok(undefined);
}
