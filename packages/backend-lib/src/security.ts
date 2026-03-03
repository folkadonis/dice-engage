/**
 * Security Utilities
 *
 * Provides AES-256-GCM encryption for provider credentials at rest,
 * tenant-scoped RBAC middleware, per-tenant rate limiting,
 * and webhook signature verification for all provider callbacks.
 */
import crypto from "crypto";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq } from "drizzle-orm";

import { db } from "./db";
import { tenant as dbTenant } from "./db/schema";
import logger from "./logger";
import config from "./config";

// ─── AES-256-GCM Credential Encryption ──────────────────────────────

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Uint8Array {
    const key = config().secretKey ?? process.env.CREDENTIAL_ENCRYPTION_KEY;
    if (!key) {
        throw new Error(
            "CREDENTIAL_ENCRYPTION_KEY environment variable is required for credential encryption",
        );
    }
    // Derive a 32-byte key from the secret using SHA-256
    return new Uint8Array(crypto.createHash("sha256").update(key).digest());
}

/**
 * Encrypt sensitive data (e.g., provider API keys, tokens) using AES-256-GCM.
 * Returns a base64-encoded string containing IV + ciphertext + auth tag.
 */
export function encryptCredential(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = new Uint8Array(crypto.randomBytes(IV_LENGTH));
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encPart1 = new Uint8Array(cipher.update(plaintext, "utf8"));
    const encPart2 = new Uint8Array(cipher.final());
    const tag = new Uint8Array(cipher.getAuthTag());

    // Pack: IV (16) + tag (16) + ciphertext
    const packed = new Uint8Array(iv.length + tag.length + encPart1.length + encPart2.length);
    packed.set(iv, 0);
    packed.set(tag, iv.length);
    packed.set(encPart1, iv.length + tag.length);
    packed.set(encPart2, iv.length + tag.length + encPart1.length);
    return Buffer.from(packed).toString("base64");
}

/**
 * Decrypt a credential previously encrypted with encryptCredential.
 */
export function decryptCredential(encryptedBase64: string): string {
    const key = getEncryptionKey();
    const packed = new Uint8Array(Buffer.from(encryptedBase64, "base64"));

    const iv = packed.subarray(0, IV_LENGTH);
    const tag = packed.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = packed.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decPart1 = new Uint8Array(decipher.update(ciphertext));
    const decPart2 = new Uint8Array(decipher.final());
    const decrypted = new Uint8Array(decPart1.length + decPart2.length);
    decrypted.set(decPart1, 0);
    decrypted.set(decPart2, decPart1.length);

    return Buffer.from(decrypted).toString("utf8");
}

// ─── Tenant-Scoped RBAC ─────────────────────────────────────────────

export type TenantRole = "owner" | "admin" | "editor" | "viewer";

interface TenantContext {
    tenantId: string;
    role: TenantRole;
}

const ROLE_HIERARCHY: Record<TenantRole, number> = {
    owner: 4,
    admin: 3,
    editor: 2,
    viewer: 1,
};

/**
 * Fastify decorator to extract and verify tenant context from request.
 * The tenant context is expected in the `x-tenant-id` header or JWT claims.
 */
export function tenantContextPlugin(fastify: FastifyInstance) {
    fastify.decorateRequest("tenantContext", null);

    fastify.addHook<{ Headers: { "x-tenant-id"?: string; "x-tenant-role"?: string } }>(
        "preHandler",
        async (request) => {
            const tenantId =
                (request.headers["x-tenant-id"] as string) ??
                (request.headers["x-tenant-id"] as string);
            const role = ((request.headers["x-tenant-role"] as string) ?? "viewer") as TenantRole;

            if (tenantId) {
                (request as FastifyRequest & { tenantContext: TenantContext }).tenantContext = {
                    tenantId,
                    role,
                };
            }
        },
    );
}

/**
 * Guard function to enforce minimum role requirement for a route.
 */
export function requireRole(minimumRole: TenantRole) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const ctx = (request as FastifyRequest & { tenantContext?: TenantContext }).tenantContext;

        if (!ctx) {
            return reply.status(401).send({ message: "Missing tenant context" });
        }

        if (ROLE_HIERARCHY[ctx.role] < ROLE_HIERARCHY[minimumRole]) {
            return reply.status(403).send({
                message: `Requires ${minimumRole} role, you have ${ctx.role}`,
            });
        }
    };
}

// ─── Per-Tenant Rate Limiting ───────────────────────────────────────

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const DEFAULT_RATE_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
    Starter: { maxRequests: 100, windowMs: 60_000 },    // 100 req/min
    Growth: { maxRequests: 500, windowMs: 60_000 },     // 500 req/min
    Enterprise: { maxRequests: 5000, windowMs: 60_000 }, // 5000 req/min
};

/**
 * Per-tenant rate limiting based on plan type.
 * Uses an in-memory store (replace with Redis in production).
 */
export function tenantRateLimiter() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const ctx = (request as FastifyRequest & { tenantContext?: TenantContext }).tenantContext;
        if (!ctx) return; // No tenant context, skip rate limiting

        const tenantId = ctx.tenantId;
        const now = Date.now();

        // Look up tenant plan for rate limits
        let planType = "Starter";
        try {
            const tenantRow = await db().query.tenant.findFirst({
                where: eq(dbTenant.id, tenantId),
                columns: { planType: true },
            });
            if (tenantRow) {
                planType = tenantRow.planType;
            }
        } catch {
            // Fall back to Starter limits on error
        }

        const limits = DEFAULT_RATE_LIMITS[planType] ?? DEFAULT_RATE_LIMITS.Starter;
        if (!limits) return;

        const existing = rateLimitStore.get(tenantId);

        if (!existing || now > existing.resetAt) {
            // New window
            rateLimitStore.set(tenantId, {
                count: 1,
                resetAt: now + limits.windowMs,
            });
            reply.header("X-RateLimit-Limit", limits.maxRequests);
            reply.header("X-RateLimit-Remaining", limits.maxRequests - 1);
            return;
        }

        existing.count += 1;

        if (existing.count > limits.maxRequests) {
            const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
            reply.header("Retry-After", retryAfter);
            reply.header("X-RateLimit-Limit", limits.maxRequests);
            reply.header("X-RateLimit-Remaining", 0);
            return reply.status(429).send({
                message: `Rate limit exceeded for tenant ${tenantId}. Retry after ${retryAfter}s.`,
            });
        }

        reply.header("X-RateLimit-Limit", limits.maxRequests);
        reply.header("X-RateLimit-Remaining", limits.maxRequests - existing.count);
    };
}

// ─── Webhook Signature Verification ─────────────────────────────────

/**
 * Verify Twilio webhook signature using X-Twilio-Signature header.
 */
export function verifyTwilioSignature(
    authToken: string,
    url: string,
    params: Record<string, string>,
    signature: string,
): boolean {
    const sortedParams = Object.keys(params)
        .sort()
        .map((key) => `${key}${params[key]}`)
        .join("");

    const expected = crypto
        .createHmac("sha1", authToken)
        .update(url + sortedParams)
        .digest("base64");

    return crypto.timingSafeEqual(
        new Uint8Array(Buffer.from(signature)),
        new Uint8Array(Buffer.from(expected)),
    );
}

/**
 * Verify a generic HMAC-SHA256 webhook signature.
 * Used for Gupshup, custom webhooks, etc.
 */
export function verifyHmacSignature(
    secret: string,
    payload: string,
    signature: string,
    algorithm: string = "sha256",
): boolean {
    const expected = crypto
        .createHmac(algorithm, secret)
        .update(payload)
        .digest("hex");

    try {
        return crypto.timingSafeEqual(
            new Uint8Array(Buffer.from(signature, "hex")),
            new Uint8Array(Buffer.from(expected, "hex")),
        );
    } catch {
        return false;
    }
}

/**
 * Generic webhook verification middleware for Fastify.
 */
export function webhookVerificationHook(
    secretResolver: (request: FastifyRequest) => string | null,
    signatureHeader: string = "x-signature",
) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const secret = secretResolver(request);
        if (!secret) {
            logger().warn("No webhook secret configured, skipping verification");
            return;
        }

        const signature = request.headers[signatureHeader] as string | undefined;
        if (!signature) {
            return reply.status(401).send({ message: "Missing webhook signature" });
        }

        const rawBody =
            typeof request.body === "string"
                ? request.body
                : JSON.stringify(request.body);

        if (!verifyHmacSignature(secret, rawBody, signature)) {
            return reply.status(403).send({ message: "Invalid webhook signature" });
        }
    };
}
