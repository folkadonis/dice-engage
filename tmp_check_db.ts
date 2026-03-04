import { db } from "../packages/backend-lib/src/db";
import * as schema from "../packages/backend-lib/src/db/schema";
import { sql } from "drizzle-orm";

async function run() {
    try {
        console.log("Checking tables...");
        const tables = await db().execute(sql`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`);
        console.log("Tables:", tables.rows);

        const migrations = await db().execute(sql`SELECT * FROM "__drizzle_migrations"`);
        console.log("Migrations:", migrations.rows);

        const workspaces = await db().query.workspace.findMany();
        console.log("Workspaces:", workspaces);
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
