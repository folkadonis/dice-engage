/**
 * Dead Letter Queue (DLQ) and Retry Logic
 *
 * Implements exponential backoff retry for failed message sends
 * with a dead letter queue for permanently failed messages.
 */
import logger from "./logger";

export interface RetryConfig {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: parseInt(process.env.DLQ_MAX_RETRIES ?? "3", 10),
    baseDelayMs: parseInt(process.env.DLQ_RETRY_DELAY_MS ?? "1000", 10),
    maxDelayMs: 30_000,
    backoffMultiplier: 2,
};

export interface DLQEntry<T = unknown> {
    id: string;
    payload: T;
    error: string;
    attempts: number;
    firstAttemptAt: Date;
    lastAttemptAt: Date;
    nextRetryAt: Date | null;
    status: "pending" | "retrying" | "dead";
}

// In-memory DLQ store (replace with Redis/DB in production)
const dlqStore = new Map<string, DLQEntry>();

/**
 * Calculate delay using exponential backoff with jitter.
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = Math.min(
        config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelayMs,
    );
    // Add up to 25% jitter
    const jitter = delay * 0.25 * Math.random();
    return Math.floor(delay + jitter);
}

/**
 * Execute a function with retry logic and DLQ support.
 */
export async function withRetry<T>(
    id: string,
    fn: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            const result = await fn();

            // Success — remove from DLQ if it was there
            dlqStore.delete(id);
            return result;
        } catch (e) {
            lastError = e as Error;

            logger().warn(
                { id, attempt, maxRetries: config.maxRetries, error: lastError.message },
                "Retry attempt failed",
            );

            if (attempt < config.maxRetries) {
                const delay = calculateDelay(attempt, config);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    // All retries exhausted — send to DLQ
    const now = new Date();
    const entry: DLQEntry = {
        id,
        payload: null,
        error: lastError?.message ?? "Unknown error",
        attempts: config.maxRetries + 1,
        firstAttemptAt: now,
        lastAttemptAt: now,
        nextRetryAt: null,
        status: "dead",
    };

    dlqStore.set(id, entry);
    logger().error(
        { id, error: lastError?.message, attempts: config.maxRetries + 1 },
        "Message moved to DLQ after exhausting retries",
    );

    throw lastError;
}

/**
 * Get all DLQ entries (for admin panel monitoring).
 */
export function getDLQEntries(): DLQEntry[] {
    return Array.from(dlqStore.values());
}

/**
 * Get DLQ stats.
 */
export function getDLQStats(): {
    total: number;
    dead: number;
    retrying: number;
    pending: number;
} {
    const entries = Array.from(dlqStore.values());
    return {
        total: entries.length,
        dead: entries.filter((e) => e.status === "dead").length,
        retrying: entries.filter((e) => e.status === "retrying").length,
        pending: entries.filter((e) => e.status === "pending").length,
    };
}

/**
 * Clear a specific DLQ entry (after manual resolution).
 */
export function clearDLQEntry(id: string): boolean {
    return dlqStore.delete(id);
}

/**
 * Clear all DLQ entries.
 */
export function clearDLQ(): void {
    dlqStore.clear();
}
