import { FastifyInstance } from "fastify";
import {
    createAdhocList,
    deleteAdhocList,
    getAdhocListById,
    getAdhocListDeliveryStats,
    getAdhocLists,
    getAdhocListStats,
    markAdhocListAsSending,
    parseCSV,
    parsePasteList,
    updateAdhocListStatus,
} from "backend-lib/src/adhocLists";

export default async function adhocListsController(fastify: FastifyInstance) {
    // ── GET /adhoc-lists ─ List all ad-hoc lists for workspace ────────
    fastify.get("/", async (request, reply) => {
        const { workspaceId } = request.query as { workspaceId: string };
        if (!workspaceId) {
            return reply.status(400).send({ error: "workspaceId is required" });
        }

        const lists = await getAdhocLists(workspaceId);
        const stats = await getAdhocListStats(workspaceId);

        return reply.status(200).send({ lists, stats });
    });

    // ── GET /adhoc-lists/:id ─ Get a single list with recipients ─────
    fastify.get("/:id", async (request, reply) => {
        const { id } = request.params as { id: string };
        const { workspaceId } = request.query as { workspaceId: string };
        if (!workspaceId) {
            return reply.status(400).send({ error: "workspaceId is required" });
        }

        const list = await getAdhocListById(id, workspaceId);
        if (!list) {
            return reply.status(404).send({ error: "List not found" });
        }

        return reply.status(200).send(list);
    });

    // ── POST /adhoc-lists ─ Create a new ad-hoc list ─────────────────
    fastify.post("/", async (request, reply) => {
        const body = request.body as {
            workspaceId: string;
            name: string;
            recipients: Array<{
                email?: string;
                phone?: string;
                firstName?: string;
                lastName?: string;
                properties?: Record<string, unknown>;
            }>;
            channel?: string;
            templateId?: string;
            savedForReuse?: boolean;
        };

        if (!body.workspaceId || !body.name) {
            return reply.status(400).send({ error: "workspaceId and name are required" });
        }
        if (!body.recipients || body.recipients.length === 0) {
            return reply.status(400).send({ error: "At least one recipient is required" });
        }

        const result = await createAdhocList(body);
        return reply.status(201).send(result);
    });

    // ── POST /adhoc-lists/parse-csv ─ Parse CSV content ──────────────
    fastify.post("/parse-csv", async (request, reply) => {
        const { csvContent } = request.body as { csvContent: string };
        if (!csvContent) {
            return reply.status(400).send({ error: "csvContent is required" });
        }

        const result = parseCSV(csvContent);
        return reply.status(200).send({
            recipients: result.recipients,
            count: result.recipients.length,
            duplicatesRemoved: result.duplicatesRemoved,
            errors: result.errors,
        });
    });

    // ── POST /adhoc-lists/parse-paste ─ Parse pasted text ────────────
    fastify.post("/parse-paste", async (request, reply) => {
        const { text } = request.body as { text: string };
        if (!text) {
            return reply.status(400).send({ error: "text is required" });
        }

        const result = parsePasteList(text);
        return reply.status(200).send({
            recipients: result.recipients,
            count: result.recipients.length,
            duplicatesRemoved: result.duplicatesRemoved,
        });
    });

    // ── POST /adhoc-lists/:id/send ─ Trigger send for the list ───────
    fastify.post("/:id/send", async (request, reply) => {
        const { id } = request.params as { id: string };
        const { workspaceId, channel, templateId } = request.body as {
            workspaceId: string;
            channel: string;
            templateId: string;
        };

        if (!workspaceId || !channel || !templateId) {
            return reply
                .status(400)
                .send({ error: "workspaceId, channel, and templateId are required" });
        }

        const list = await getAdhocListById(id, workspaceId);
        if (!list) {
            return reply.status(404).send({ error: "List not found" });
        }

        if (list.status === "Sending" || list.status === "Sent") {
            return reply
                .status(409)
                .send({ error: `List is already ${list.status.toLowerCase()}` });
        }

        // Mark as sending — actual message dispatch would be handled by the
        // worker process reading the list recipients and sending via the
        // configured channel provider.
        await markAdhocListAsSending(id);

        return reply.status(202).send({
            message: "Send initiated",
            listId: id,
            recipientCount: list.recipientCount,
            channel,
            templateId,
        });
    });

    // ── GET /adhoc-lists/:id/stats ─ Delivery stats for a list ───────
    fastify.get("/:id/stats", async (request, reply) => {
        const { id } = request.params as { id: string };

        const stats = await getAdhocListDeliveryStats(id);
        return reply.status(200).send(stats);
    });

    // ── DELETE /adhoc-lists/:id ─ Delete an ad-hoc list ──────────────
    fastify.delete("/:id", async (request, reply) => {
        const { id } = request.params as { id: string };
        const { workspaceId } = request.query as { workspaceId: string };
        if (!workspaceId) {
            return reply.status(400).send({ error: "workspaceId is required" });
        }

        const deleted = await deleteAdhocList(id, workspaceId);
        if (!deleted) {
            return reply.status(404).send({ error: "List not found" });
        }

        return reply.status(200).send({ message: "List deleted" });
    });

    // ── PATCH /adhoc-lists/:id/save ─ Toggle saved-for-reuse ─────────
    fastify.patch("/:id/save", async (request, reply) => {
        const { id } = request.params as { id: string };
        const { workspaceId } = request.query as { workspaceId: string };
        if (!workspaceId) {
            return reply.status(400).send({ error: "workspaceId is required" });
        }

        const list = await getAdhocListById(id, workspaceId);
        if (!list) {
            return reply.status(404).send({ error: "List not found" });
        }

        // Toggle the savedForReuse flag
        const { db: getDb } = await import("backend-lib/src/db");
        const { adhocList: adhocListTable } = await import("backend-lib/src/db/schema");
        const { eq } = await import("drizzle-orm");

        await getDb()
            .update(adhocListTable)
            .set({ savedForReuse: !list.savedForReuse })
            .where(eq(adhocListTable.id, id));

        return reply.status(200).send({
            message: list.savedForReuse ? "List unsaved" : "List saved for reuse",
            savedForReuse: !list.savedForReuse,
        });
    });
}
