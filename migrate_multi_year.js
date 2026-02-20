import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });
// fallback if local exists and needed
if (!process.env.DATABASE_URL) {
    dotenv.config({ path: resolve(__dirname, '.env.local') });
}

const { Client } = pg;
const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    await client.connect();
    console.log("Connected to DB. Running Migration...");

    try {
        await client.query(`
      ALTER TABLE initiatives 
      ADD COLUMN IF NOT EXISTS capex_current_fy NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS opex_current_fy NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_initiative_cost NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_multi_year BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS future_annual_opex NUMERIC DEFAULT 0;
    `);
        console.log("Migration successful.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await client.end();
    }
}

run();
