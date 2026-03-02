import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });
if (!process.env.DATABASE_URL) {
    dotenv.config({ path: resolve(__dirname, '.env.local') });
}

const { Client } = pg;
const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    await client.connect();
    console.log("Connected to DB. Applying decision_feedback RLS...");

    try {
        const sql = fs.readFileSync(resolve(__dirname, 'decision_feedback_rls.sql'), 'utf8');
        await client.query(sql);
        console.log("RLS Policies applied successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await client.end();
    }
}

run();
