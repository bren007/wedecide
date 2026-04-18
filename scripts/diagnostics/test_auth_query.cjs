const { Client } = require('pg');

async function testQuery() {
    const client = new Client({ connectionString: 'postgresql://postgres.bxiylyhkxdyreveervhj:XA%2Ay%3F47%3Ff3YbY%243@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=no-verify' });
    await client.connect();

    console.log('Connected to DB');

    try {
        // Simulate authenticated session
        await client.query("SET ROLE authenticated");
        await client.query("SET statement_timeout TO 5000"); // 5s timeout to catch infinite loops

        // Simulate auth.uid()
        const userId = 'd8c194d8-7a54-4d4f-b524-0da518df8e4e';
        await client.query(`
      SELECT set_config('request.jwt.claims', '{"sub": "${userId}"}', true);
    `);

        console.log('Executing query...');
        const t0 = Date.now();
        const res = await client.query(`SELECT * FROM users WHERE id = '${userId}'`);
        console.log('Query took', Date.now() - t0, 'ms');
        console.log('Rows found:', res.rows.length);

    } catch (err) {
        console.error('Query Error:', err);
    } finally {
        await client.end();
    }
}

testQuery();
