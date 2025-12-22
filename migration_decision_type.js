import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ Error: DIRECT_URL or DATABASE_URL not found');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('🔌 Connected to database. Adding decision_type column...');

        await client.query(`
            ALTER TABLE decisions 
            ADD COLUMN IF NOT EXISTS decision_type TEXT DEFAULT 'approve' NOT NULL;
        `);

        console.log('✅ Column added successfully.');
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

main();
