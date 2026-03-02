
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ No database connection string found in .env.local');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function applyMigration() {
    try {
        await client.connect();
        console.log('🔗 Connected to database for Strategic Governance Migration...');

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        // Correct path to the migration file
        const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', 'pivot_to_strategic_governance.sql');

        if (!fs.existsSync(sqlPath)) {
            throw new Error(`Migration file not found at: ${sqlPath}`);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('▶️ Executing SQL Migration...');
        await client.query(sql);
        console.log('✅ Strategic Governance Schema Applied!');

        // Reload schema cache
        console.log('🔄 Reloading schema cache...');
        await client.query("NOTIFY pgrst, 'reload schema'");

    } catch (err) {
        console.error('❌ Error applying migration:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyMigration();
