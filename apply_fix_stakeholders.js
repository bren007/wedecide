import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ Error: DIRECT_URL or DATABASE_URL not found in .env.local');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const file = 'fix_stakeholders_schema.sql';
        const sqlPath = path.join(__dirname, file);

        if (fs.existsSync(sqlPath)) {
            console.log(`\n📄 Applying ${file}...`);
            const sql = fs.readFileSync(sqlPath, 'utf8');
            await client.query(sql);
            console.log('   ✅ Success');
        } else {
            console.error(`   ❌ File ${file} not found.`);
        }

    } catch (err) {
        console.error('❌ Error executing SQL script:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
