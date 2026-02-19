
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        await client.connect();

        console.log('Fetching initiatives...');
        const res = await client.query('SELECT * FROM initiatives LIMIT 10');
        console.table(res.rows.map(r => ({ ...r, created_at: undefined, updated_at: undefined })));

    } catch (err) {
        console.error('Error fetching initiatives:', err);
    } finally {
        await client.end();
    }
}

main();
