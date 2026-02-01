
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

        console.log('\n--- 1. Checking relevant tables in public schema ---');
        const tables = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename IN ('users', 'profiles', 'decisions');
        `);
        console.table(tables.rows);

        console.log('\n--- 2. Checking constraints on decisions table ---');
        const constraints = await client.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint 
            WHERE conrelid = 'decisions'::regclass;
        `);
        console.table(constraints.rows);

        console.log('\n--- 3. Checking constraints on stakeholders table ---');
        const constraintsStakeholders = await client.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint 
            WHERE conrelid = 'stakeholders'::regclass;
        `);
        console.table(constraintsStakeholders.rows);


        console.log('\n--- 4. Checking constraints on other tables ---');
        const otherTables = ['documents', 'affected_parties', 'decision_feedback', 'decision_rapid_roles', 'agenda_items'];

        for (const table of otherTables) {
            console.log(`\nChecking ${table}...`);
            const res = await client.query(`
                SELECT conname, pg_get_constraintdef(oid) as definition
                FROM pg_constraint 
                WHERE conrelid = $1::regclass;
            `, [table]);
            if (res.rows.length === 0) console.log('  No constraints found.');
            else console.table(res.rows);
        }


    } catch (err) {
        console.error('Inspection failed:', err);
    } finally {
        await client.end();
    }
}
main();
