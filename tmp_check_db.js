const { Client } = require('pg');

const databaseUrl = 'postgresql://neondb_owner:npg_kJYiLFes9V0Q@ep-fragrant-heart-aiy9uam6-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function run() {
    const client = new Client({ connectionString: databaseUrl });
    try {
        await client.connect();
        console.log("Connected to DB");

        const tables = await client.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
        const tableNames = tables.rows.map(r => r.tablename);
        console.log("Tables:", tableNames);

        if (tableNames.includes('__drizzle_migrations')) {
            const migrations = await client.query('SELECT * FROM "__drizzle_migrations"');
            console.log("Migrations:", migrations.rows);
        } else {
            console.log("__drizzle_migrations table does NOT exist");
        }

        if (tableNames.includes('Workspace')) {
            const workspaces = await client.query('SELECT * FROM "Workspace"');
            console.log("Workspaces count:", workspaces.rows.length);
            console.log("Workspaces:", workspaces.rows);
        }

        if (tableNames.includes('Tenant')) {
            const tenants = await client.query('SELECT * FROM "Tenant"');
            console.log("Tenants count:", tenants.rows.length);
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}

run();
