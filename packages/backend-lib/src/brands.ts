import { eq } from "drizzle-orm";
import { err, ok, Result } from "neverthrow";

import { db, insert, queryResult, QueryError } from "./db";
import { brand as dbBrand } from "./db/schema";
import {
    BrandResource,
    UpsertBrandResource,
} from "isomorphic-lib/src/types";

// ─── Brand Type from DB ──────────────────────────────────────────────
type Brand = typeof dbBrand.$inferSelect;

function toBrandResource(brand: Brand): BrandResource {
    return {
        id: brand.id,
        tenantId: brand.tenantId,
        name: brand.name,
        timezone: brand.timezone,
        senderConfigJson: brand.senderConfigJson ?? undefined,
        createdAt: brand.createdAt.toISOString(),
        updatedAt: brand.updatedAt.toISOString(),
    };
}

// ─── Create Brand ────────────────────────────────────────────────────
export async function createBrand(
    data: UpsertBrandResource,
): Promise<Result<BrandResource, QueryError>> {
    const result = await insert({
        table: dbBrand,
        values: {
            ...(data.id ? { id: data.id } : {}),
            tenantId: data.tenantId,
            name: data.name,
            ...(data.timezone ? { timezone: data.timezone } : {}),
            ...(data.senderConfigJson
                ? { senderConfigJson: data.senderConfigJson }
                : {}),
        },
    });

    if (result.isErr()) {
        return err(result.error);
    }

    return ok(toBrandResource(result.value));
}

// ─── Get Brand by ID ─────────────────────────────────────────────────
export async function getBrand(
    brandId: string,
): Promise<BrandResource | null> {
    const result = await db().query.brand.findFirst({
        where: eq(dbBrand.id, brandId),
    });

    if (!result) {
        return null;
    }

    return toBrandResource(result);
}

// ─── List Brands for Tenant ──────────────────────────────────────────
export async function listBrands(params: {
    tenantId: string;
}): Promise<BrandResource[]> {
    const brands = await db().query.brand.findMany({
        where: eq(dbBrand.tenantId, params.tenantId),
        orderBy: (b, { desc }) => [desc(b.createdAt)],
    });

    return brands.map(toBrandResource);
}

// ─── Update Brand ────────────────────────────────────────────────────
export async function updateBrand(
    brandId: string,
    data: Partial<
        Pick<UpsertBrandResource, "name" | "timezone" | "senderConfigJson">
    >,
): Promise<Result<BrandResource, QueryError>> {
    const updateValues: Record<string, unknown> = {};

    if (data.name !== undefined) updateValues.name = data.name;
    if (data.timezone !== undefined) updateValues.timezone = data.timezone;
    if (data.senderConfigJson !== undefined) {
        updateValues.senderConfigJson = data.senderConfigJson;
    }

    const result = await queryResult(
        db()
            .update(dbBrand)
            .set(updateValues)
            .where(eq(dbBrand.id, brandId))
            .returning(),
    );

    if (result.isErr()) {
        return err(result.error);
    }

    const updated = result.value[0];
    if (!updated) {
        return err(new Error("Brand not found") as unknown as QueryError);
    }

    return ok(toBrandResource(updated));
}

// ─── Delete Brand ────────────────────────────────────────────────────
export async function deleteBrand(
    brandId: string,
): Promise<Result<void, QueryError>> {
    const result = await queryResult(
        db().delete(dbBrand).where(eq(dbBrand.id, brandId)),
    );

    if (result.isErr()) {
        return err(result.error);
    }

    return ok(undefined);
}
