
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ No database connection string found in .env.local');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function applyFix() {
    try {
        await client.connect();
        console.log('🔗 Connected to database for Schema Fix...');

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const sqlPath = path.join(__dirname, 'fix_meeting_groups_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('▶️ Executing SQL...');
        await client.query(sql);
        console.log('✅ Schema Fix Applied (TEXT -> UUID)!');

        // Reload schema cache
        console.log('🔄 Reloading schema cache...');
        await client.query("NOTIFY pgrst, 'reload schema'");

    } catch (err) {
        console.error('❌ Error applying fix:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyFix();
