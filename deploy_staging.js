import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

console.log('📝 Loading environment from .env.local...');
dotenv.config({ path: '.env.local' });

// Use staging URL explicitly to ensure we deploy to staging even though .env is dev
const connectionString = "postgresql://postgres.bxiylyhkxdyreveervhj:XA%2Ay%3F47%3Ff3YbY%243@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=no-verify";
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

        const files = [
            'supabase/migrations/pivot_to_strategic_governance.sql',
            'rpc_update_leads.sql'
        ];

        for (const file of files) {
            const sqlPath = path.join(__dirname, file);
            if (!fs.existsSync(sqlPath)) {
                console.warn(`⚠️ File not found: ${sqlPath}, skipping...`);
                continue;
            }
            console.log(`📖 Reading SQL from ${sqlPath}...`);
            const sql = fs.readFileSync(sqlPath, 'utf8');

            console.log(`▶️ Executing SQL for ${file}...`);
            await client.query(sql);
            console.log(`✅ Applied ${file} successfully.`);
        }

        console.log('🎉 Staging Environment Update Complete.');

    } catch (err) {
        console.error('❌ Error executing SQL:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
