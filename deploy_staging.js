import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Load .env.local
console.log('📝 Loading environment from .env.local...');
const result = dotenv.config({ path: '.env.local' });

if (result.error) {
    console.error('❌ Could not load .env.local file');
    process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    // ---------------------------------------------------------
    // STEP 1: Update Prisma Schema (DB Push)
    // ---------------------------------------------------------
    console.log('\n🔄 STEP 1: Syncing Prisma Schema to Staging DB...');
    try {
        // We pass the loaded env vars to the child process so Prisma sees them
        execSync('npx prisma db push --accept-data-loss', {
            stdio: 'inherit',
            env: { ...process.env }
        });
        console.log('✅ Prisma sync complete.');
    } catch (error) {
        console.error('❌ Prisma db push failed.');
        process.exit(1);
    }

    // ---------------------------------------------------------
    // STEP 2: Apply Supabase SQL (RLS & Functions)
    // ---------------------------------------------------------
    console.log('\n🔄 STEP 2: Applying Supabase SQL Scripts...');

    // We prefer DIRECT_URL for migrations, fallback to DATABASE_URL
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ Error: DIRECT_URL or DATABASE_URL not found in .env.local');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const sqlPath = path.join(__dirname, 'supabase_staging_update.sql');
        console.log(`   Reading SQL from ${sqlPath}...`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('   Executing SQL...');
        await client.query(sql);
        console.log('✅ Supabase SQL applied successfully!');

    } catch (err) {
        console.error('❌ Error executing SQL script:', err);
        process.exit(1);
    } finally {
        await client.end();
    }

    console.log('\n🚀 Staging Update Complete! You can now git push.');
}

main();
