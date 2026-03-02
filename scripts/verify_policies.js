
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function verify() {
    await client.connect();
    const res = await client.query(`
        SELECT tablename, policyname, cmd, with_check 
        FROM pg_policies 
        WHERE tablename IN ('meetings', 'meeting_groups')
        ORDER BY tablename, policyname;
    `);
    console.table(res.rows);
    await client.end();
}

verify();
