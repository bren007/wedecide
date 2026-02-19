
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function apply() {
    await client.connect();
    const sql = fs.readFileSync('fix_timestamp_defaults.sql', 'utf8');
    await client.query(sql);
    console.log('Applied timestamp defaults fix');
    await client.end();
}

apply();
