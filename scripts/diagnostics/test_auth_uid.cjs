const { Client } = require('pg');
async function test() {
    const client = new Client({ connectionString: 'postgresql://postgres.dakkjqqfskzsymkclymw:CU6Y1D2V610cttXs@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
    await client.connect();

    await client.query('RESET ROLE');
    const userId = 'd8c194d8-7a54-4d4f-b524-0da518df8e4e';
    // Supabase uses 'request.jwt.claims' where sub is a string. Or request.jwt.claim.sub.
    await client.query(`SELECT set_config('request.jwt.claims', '{"sub": "${userId}"}', false)`);
    await client.query('SET ROLE authenticated');

    try {
        const res = await client.query('SELECT auth.uid() as my_uid');
        console.log('auth.uid():', res.rows[0]);
    } catch (e) {
        console.error(e.message);
    }
    await client.end();
}
test();
