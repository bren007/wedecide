
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const DB_CONNECTION_STRING = process.env.DIRECT_URL || process.env.DATABASE_URL;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const pgClient = new Client({
    connectionString: DB_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    await pgClient.connect();

    // 1. Get an org ID (any org)
    const res = await pgClient.query("SELECT id FROM organizations LIMIT 1");
    if (res.rows.length === 0) {
        console.log('No orgs found, skipping');
        return;
    }
    const orgId = res.rows[0].id;
    console.log('Using Org ID:', orgId);

    // 2. Insert Meeting via Supabase
    console.log('Inserting meeting...');
    const { data, error } = await supabase
        .from('meetings')
        .insert({
            organization_id: orgId,
            title: 'Debug Meeting',
            scheduled_at: new Date().toISOString(),
            status: 'scheduled',
            updated_at: new Date().toISOString() // Try providing this too
        })
        .select()
        .single();

    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log('Insert Success:', data);
        // cleanup
        await pgClient.query("DELETE FROM meetings WHERE id = $1", [data.id]);
    }

    await pgClient.end();
}

main();
