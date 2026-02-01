import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

console.log('📝 Loading environment from .env.local...');
dotenv.config({ path: '.env.local' });

// Use DIRECT_URL which should be using port 6543 now
const connectionString = process.env.DIRECT_URL;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    console.log('🚀 Starting Manual Staging Deployment via raw SQL...');
    console.log(`🔌 Connecting to: ${connectionString.replace(/:[^:@]*@/, ':****@')}`);

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
    });

    try {
        await client.connect();
        console.log('✅ Connected.');

        const sqlPath = path.join(__dirname, 'staging_manual_fix.sql');
        console.log(`📖 Reading SQL from ${sqlPath}...`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('▶️ Executing SQL...');
        // Split by semicolon to run statements essentially? Or just run block.
        // pg driver can multiple statements usually if straightforward.
        await client.query(sql);
        console.log('✅ SQL Applied Successfully.');

    } catch (err) {
        console.error('❌ Error executing SQL:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
