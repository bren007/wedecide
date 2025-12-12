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
    // Log masked URL for debugging purposes
    const maskedUrl = connectionString.replace(/:[^:]*@/, ':****@');
    console.log(`   URL: ${maskedUrl}`);

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // List of SQL files to apply, in order of dependency
        // Adjust this list as needed for your specific dev reset needs
        const sqlFiles = [
            'supabase_staging_update.sql' // This contains the latest stable set of policies/functions
        ];

        for (const file of sqlFiles) {
            const sqlPath = path.join(__dirname, file);
            if (fs.existsSync(sqlPath)) {
                console.log(`\n📄 Applying ${file}...`);
                const sql = fs.readFileSync(sqlPath, 'utf8');
                await client.query(sql);
                console.log('   ✅ Success');
            } else {
                console.warn(`   ⚠️ File ${file} not found, skipping.`);
            }
        }

        console.log('\n🚀 Database Sync Complete!');

    } catch (err) {
        console.error('❌ Error executing SQL script:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
