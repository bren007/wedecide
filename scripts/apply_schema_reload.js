
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

// Use DIRECT_URL for schema changes
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    console.log('🔄 Reloading PostgREST Schema Cache...');

    if (!connectionString) {
        console.error('❌ DIRECT_URL or DATABASE_URL not found in .env.local');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
    });

    try {
        await client.connect();
        console.log('✅ Connected to DB.');

        const sqlPath = path.join(__dirname, 'reload_schema_cache.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('▶️ Executing NOTIFY pgrst...');
        await client.query(sql);
        console.log('✅ Schema Cache Reload Triggered!');

    } catch (err) {
        console.error('❌ Error executing SQL:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
