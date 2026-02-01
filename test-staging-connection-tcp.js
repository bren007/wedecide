import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Decoded password if needed: XA*y?47?f3YbY$3
// Encoded in env: XA%2Ay%3F47%3Ff3YbY%243

// Test AWS Pooler on 6543
const connectionString = 'postgresql://postgres.bxiylyhkxdyreveervhj:XA%2Ay%3F47%3Ff3YbY%243@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=no-verify';
console.log('Testing connection to:', connectionString.replace(/:[^:@]*@/, ':****@'));

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
});

async function test() {
    try {
        console.log('Connecting...');
        await client.connect();
        console.log('✅ Connected successfully!');
        const res = await client.query('SELECT NOW()');
        console.log('Time:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('❌ Connection failed:', err);
    }
}

test();
