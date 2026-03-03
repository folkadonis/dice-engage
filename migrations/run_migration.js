const fs = require('fs');
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: process.argv[2],
        ssl: { rejectUnauthorized: false },
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const sql = fs.readFileSync(process.argv[3], 'utf8');

        // Split on statement boundaries and execute
        await client.query(sql);
        console.log('Migration executed successfully');

        // List all tables
        const res = await client.query(
            `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
        );
        console.log(`\nTables created: ${res.rows.length}`);
        res.rows.forEach(r => console.log(`  - ${r.tablename}`));

        // List all enums
        const enumRes = await client.query(
            `SELECT t.typname FROM pg_type t JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e' ORDER BY t.typname`
        );
        console.log(`\nEnums created: ${enumRes.rows.length}`);
        enumRes.rows.forEach(r => console.log(`  - ${r.typname}`));

    } catch (err) {
        console.error('ERROR:', err.message);
        if (err.position) {
            const lines = fs.readFileSync(process.argv[3], 'utf8').substring(0, parseInt(err.position)).split('\n');
            console.error(`At line: ${lines.length}`);
        }
    } finally {
        await client.end();
    }
}

run();
