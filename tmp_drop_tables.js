const { Client } = require('pg');

const databaseUrl = 'postgresql://neondb_owner:npg_kJYiLFes9V0Q@ep-fragrant-heart-aiy9uam6-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function run() {
    const client = new Client({ connectionString: databaseUrl });
    try {
        await client.connect();
        console.log("Connected to DB");

        console.log("Dropping tables...");
        // This is a more safe way to drop all tables in public schema
        await client.query(`
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                END LOOP;
                FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e') LOOP
                    EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
                END LOOP;
            END $$;
        `);
        console.log("Tables dropped successfully");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}

run();
