import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false } // Try permissive SSL
});

console.log('Connecting to:', process.env.DIRECT_URL?.replace(/:[^:]*@/, ':****@')); // Mask password

client.connect()
    .then(() => {
        console.log('✅ Connected successfully!');
        return client.end();
    })
    .catch(err => {
        console.error('❌ Connection failed:', err);
        process.exit(1);
    });
