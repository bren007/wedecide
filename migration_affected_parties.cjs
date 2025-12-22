const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function migrate() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        console.log('Creating affected_parties table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS affected_parties (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                decision_id TEXT NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
            );
        `);
        console.log('✅ affected_parties table created successfully');

    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
