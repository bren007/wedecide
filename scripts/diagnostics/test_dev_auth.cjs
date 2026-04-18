const { Client } = require('pg');
async function testQuery() {
    const client = new Client({ connectionString: 'postgresql://postgres.dakkjqqfskzsymkclymw:CU6Y1D2V610cttXs@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
    await client.connect();
    try {
        await client.query("SET ROLE authenticated");
        await client.query("SET statement_timeout TO 3000");
        const userId = 'd8c194d8-7a54-4d4f-b524-0da518df8e4e';
        await client.query(`SELECT set_config('request.jwt.claims', '{"sub": "${userId}"}', true);`);

        console.log('Executing users query...');
        let t0 = Date.now();
        const res = await client.query(`SELECT * FROM users WHERE id = '${userId}'`);
        console.log('users query took', Date.now() - t0, 'ms. Rows:', res.rows.length);

        console.log('Executing user_roles query...');
        t0 = Date.now();
        const res2 = await client.query(`SELECT * FROM user_roles WHERE user_id = '${userId}'`);
        console.log('user_roles query took', Date.now() - t0, 'ms. Rows:', res2.rows.length);
    } catch (err) {
        console.error('Query Error:', err.message);
    } finally {
        await client.end();
    }
}
testQuery();
