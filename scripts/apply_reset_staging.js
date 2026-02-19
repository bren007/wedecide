
import pkg from 'pg';
const { Client } = pkg;
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
        console.log('🔗 Connected to FORCE RESET Staging Schema...');

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const sqlPath = path.join(__dirname, 'reset_staging_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('▶️ Executing DROP CASCADE...');
        await client.query(sql);
        console.log('✅ Staging Schema Cleared!');

    } catch (err) {
        console.error('❌ Error resetting schema:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyFix();
