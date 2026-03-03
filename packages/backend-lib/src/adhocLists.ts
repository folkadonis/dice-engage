import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { adhocList, adhocListRecipient } from "./db/schema";

// ─── Types ──────────────────────────────────────────────────────────
export interface AdhocRecipientInput {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    properties?: Record<string, unknown>;
}

export interface CreateAdhocListInput {
    workspaceId: string;
    name: string;
    recipients: AdhocRecipientInput[];
    channel?: string;
    templateId?: string;
    savedForReuse?: boolean;
}

export interface ParsedCSVResult {
    recipients: AdhocRecipientInput[];
    duplicatesRemoved: number;
    errors: string[];
}

// ─── CSV Parsing ────────────────────────────────────────────────────
export function parseCSV(csvContent: string): ParsedCSVResult {
    const lines = csvContent
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    if (lines.length < 2) {
        return { recipients: [], duplicatesRemoved: 0, errors: ["CSV must have a header row and at least one data row"] };
    }

    const headerLine = lines[0];
    if (!headerLine) {
        return { recipients: [], duplicatesRemoved: 0, errors: ["CSV must have a header row"] };
    }
    const headers = headerLine.toLowerCase().split(",").map((h) => h.trim());
    const emailIdx = headers.indexOf("email");
    const phoneIdx = headers.indexOf("phone");
    const firstNameIdx = headers.indexOf("firstname");
    const lastNameIdx = headers.indexOf("lastname");

    if (emailIdx === -1 && phoneIdx === -1) {
        return { recipients: [], duplicatesRemoved: 0, errors: ["CSV must have an 'email' or 'phone' column"] };
    }

    const recipients: AdhocRecipientInput[] = [];
    const seen = new Set<string>();
    let duplicatesRemoved = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const cols = line.split(",").map((c) => c.trim());
        const email = emailIdx !== -1 ? cols[emailIdx] : undefined;
        const phone = phoneIdx !== -1 ? cols[phoneIdx] : undefined;

        if (!email && !phone) {
            errors.push(`Row ${i + 1}: missing both email and phone`);
            continue;
        }

        const key = `${email || ""}|${phone || ""}`.toLowerCase();
        if (seen.has(key)) {
            duplicatesRemoved++;
            continue;
        }
        seen.add(key);

        recipients.push({
            email: email || undefined,
            phone: phone || undefined,
            firstName: firstNameIdx !== -1 ? cols[firstNameIdx] : undefined,
            lastName: lastNameIdx !== -1 ? cols[lastNameIdx] : undefined,
        });
    }

    return { recipients, duplicatesRemoved, errors };
}

// ─── Paste list parsing (one email/phone per line) ─────────────────
export function parsePasteList(text: string): ParsedCSVResult {
    const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    const recipients: AdhocRecipientInput[] = [];
    const seen = new Set<string>();
    let duplicatesRemoved = 0;

    for (const line of lines) {
        const key = line.toLowerCase();
        if (seen.has(key)) {
            duplicatesRemoved++;
            continue;
        }
        seen.add(key);

        const isPhone = /^\+?\d[\d\s\-()]{6,}$/.test(line);
        recipients.push(
            isPhone ? { phone: line } : { email: line },
        );
    }

    return { recipients, duplicatesRemoved, errors: [] };
}

// ─── CRUD Operations ────────────────────────────────────────────────
export async function createAdhocList(input: CreateAdhocListInput) {
    const { workspaceId, name, recipients, channel, templateId, savedForReuse } = input;

    // Deduplicate recipients
    const seen = new Set<string>();
    const unique: AdhocRecipientInput[] = [];
    let dupes = 0;
    for (const r of recipients) {
        const key = `${r.email || ""}|${r.phone || ""}`.toLowerCase();
        if (seen.has(key)) { dupes++; continue; }
        seen.add(key);
        unique.push(r);
    }

    // Create the list
    const [list] = await db()
        .insert(adhocList)
        .values({
            workspaceId,
            name,
            status: "Ready",
            recipientCount: unique.length,
            channel: channel ?? null,
            templateId: templateId ?? null,
            savedForReuse: savedForReuse ?? false,
        })
        .returning();

    if (!list) {
        throw new Error("Failed to create ad-hoc list");
    }

    // Insert recipients in batches of 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < unique.length; i += BATCH_SIZE) {
        const batch = unique.slice(i, i + BATCH_SIZE).map((r) => ({
            listId: list.id,
            email: r.email ?? null,
            phone: r.phone ?? null,
            firstName: r.firstName ?? null,
            lastName: r.lastName ?? null,
            properties: r.properties ?? null,
            status: "pending",
        }));
        await db().insert(adhocListRecipient).values(batch);
    }

    return { list, duplicatesRemoved: dupes, recipientCount: unique.length };
}

export async function getAdhocLists(workspaceId: string) {
    return db()
        .select()
        .from(adhocList)
        .where(eq(adhocList.workspaceId, workspaceId))
        .orderBy(desc(adhocList.createdAt));
}

export async function getAdhocListById(listId: string, workspaceId: string) {
    const [list] = await db()
        .select()
        .from(adhocList)
        .where(and(eq(adhocList.id, listId), eq(adhocList.workspaceId, workspaceId)));

    if (!list) return null;

    const recipients = await db()
        .select()
        .from(adhocListRecipient)
        .where(eq(adhocListRecipient.listId, listId));

    return { ...list, recipients };
}

export async function deleteAdhocList(listId: string, workspaceId: string) {
    const result = await db()
        .delete(adhocList)
        .where(and(eq(adhocList.id, listId), eq(adhocList.workspaceId, workspaceId)))
        .returning();

    return result.length > 0;
}

export async function updateAdhocListStatus(
    listId: string,
    status: "Draft" | "Ready" | "Sending" | "Sent" | "Failed",
) {
    await db()
        .update(adhocList)
        .set({ status })
        .where(eq(adhocList.id, listId));
}

export async function getAdhocListStats(workspaceId: string) {
    const [stats] = await db()
        .select({
            totalLists: count(),
            totalRecipients: sql<number>`COALESCE(SUM(${adhocList.recipientCount}), 0)`,
            savedLists: sql<number>`COUNT(*) FILTER (WHERE ${adhocList.savedForReuse} = true)`,
        })
        .from(adhocList)
        .where(eq(adhocList.workspaceId, workspaceId));

    return stats;
}

// ─── Send broadcast to ad-hoc list ─────────────────────────────────
export async function markAdhocListAsSending(listId: string) {
    await updateAdhocListStatus(listId, "Sending");
}

export async function markRecipientSent(recipientId: string) {
    await db()
        .update(adhocListRecipient)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(adhocListRecipient.id, recipientId));
}

export async function markRecipientFailed(recipientId: string, error: string) {
    await db()
        .update(adhocListRecipient)
        .set({ status: "failed", error })
        .where(eq(adhocListRecipient.id, recipientId));
}

export async function getAdhocListDeliveryStats(listId: string) {
    const [stats] = await db()
        .select({
            total: count(),
            sent: sql<number>`COUNT(*) FILTER (WHERE ${adhocListRecipient.status} = 'sent')`,
            failed: sql<number>`COUNT(*) FILTER (WHERE ${adhocListRecipient.status} = 'failed')`,
            pending: sql<number>`COUNT(*) FILTER (WHERE ${adhocListRecipient.status} = 'pending')`,
        })
        .from(adhocListRecipient)
        .where(eq(adhocListRecipient.listId, listId));

    return stats;
}
