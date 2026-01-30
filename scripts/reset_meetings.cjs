const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function reset() {
    console.log('Connecting to database...');
    await client.connect();

    console.log('Clearing orphaned agenda links in decisions...');
    await client.query(`UPDATE "decisions" SET "agenda_item_id" = NULL;`);

    console.log('Dropping Meeting-related tables...');
    // Drop in order of dependency
    await client.query(`DROP TABLE IF EXISTS "meeting_attendees" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "agenda_items" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "meetings" CASCADE;`);

    console.log('Tables dropped.');
    await client.end();
}

reset().catch(e => {
    console.error('Error resetting tables:', e);
    process.exit(1);
});
