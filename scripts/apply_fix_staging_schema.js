
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
    console.log('🚀 Applying Schema Drift Fixes to Staging...');

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

        const sqlPath = path.join(__dirname, 'fix_staging_schema_drift.sql');
        console.log(`📖 Reading SQL from ${sqlPath}...`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('▶️ Executing SQL...');
        await client.query(sql);
        console.log('✅ Schema Fixes Applied Successfully!');

    } catch (err) {
        console.error('❌ Error executing SQL:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
