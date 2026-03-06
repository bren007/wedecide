const { Client } = require('pg');
async function testQuery() {
    const client = new Client({ connectionString: 'postgresql://postgres.dakkjqqfskzsymkclymw:CU6Y1D2V610cttXs@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
    await client.connect();
    try {
        await client.query("SET ROLE authenticated");
        const userId = 'd8c194d8-7a54-4d4f-b524-0da518df8e4e';
        await client.query(`SELECT set_config('request.jwt.claims', '{"sub": "${userId}"}', true);`);
        await client.query(`SELECT set_config('request.jwt.claim.sub', '${userId}', true);`);
        const res = await client.query(`SELECT auth.uid() as uid`);
        console.log('auth.uid():', res.rows[0]?.uid);

        const res2 = await client.query(`SELECT * FROM users WHERE id = '${userId}'`);
        console.log('Users query rows:', res2.rows.length);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}
testQuery();
