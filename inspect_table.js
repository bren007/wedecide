
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    await client.connect();
    const tableName = process.argv[2] || 'decisions';
    const columnName = process.argv[3];
    console.log(`Inspecting table: ${tableName} ${columnName ? `column: ${columnName}` : ''}`);

    let query = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
    `;

    if (columnName) {
        query += ` AND column_name = '${columnName}'`;
    }

    const res = await client.query(query);
    console.table(res.rows);
    await client.end();
}
main();
