import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load .env.local
console.log('📝 Loading environment from .env.local...');
const result = dotenv.config({ path: '.env.local' });

if (result.error) {
    console.error('❌ Could not load .env.local file');
    process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    // We prefer DIRECT_URL for migrations, fallback to DATABASE_URL
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ Error: DIRECT_URL or DATABASE_URL not found in .env.local');
        process.exit(1);
    }

    console.log('🔌 Connecting to database...');
    const maskedUrl = connectionString.replace(/:[^:]*@/, ':****@');
    console.log(`   URL: ${maskedUrl}`);

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const file = 'supabase_phase2_rls.sql';
        const sqlPath = path.join(__dirname, file);

        if (fs.existsSync(sqlPath)) {
            console.log(`\n📄 Applying ${file}...`);
            const sql = fs.readFileSync(sqlPath, 'utf8');
            await client.query(sql);
            console.log('   ✅ Success');
        } else {
            console.error(`   ❌ File ${file} not found.`);
        }

    } catch (err) {
        console.error('❌ Error executing SQL script:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
