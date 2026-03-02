import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const result = dotenv.config({ path: '.env.local' });
if (result.error) {
    console.error('❌ Could not load .env.local file');
    process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ Error: env vars not found');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const sqlPath = path.join(__dirname, 'create_leads_table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sql);
        console.log('✅ Leads table created successfully.');
    } catch (err) {
        console.error('❌ Error executing SQL script:', err);
    } finally {
        await client.end();
    }
}

main();
