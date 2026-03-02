
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    console.log('🔗 Fixing Staging Relationships...');

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const sqlPath = path.join(__dirname, 'fix_staging_relationships.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('▶️ Executing SQL...');
        await client.query(sql);
        console.log('✅ Foreign Keys Applied & Schema Cache Reloaded!');

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
