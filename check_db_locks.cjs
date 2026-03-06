const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.dakkjqqfskzsymkclymw:CU6Y1D2V610cttXs@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
    await client.connect();
    const res = await client.query(`
    SELECT pid, relation::regclass, mode, granted 
    FROM pg_locks l 
    WHERE relation::regclass::text IN ('users', 'user_roles')
  `);
    console.log('Locks:', res.rows);

    const res2 = await client.query(`
    SELECT pid, state, query 
    FROM pg_stat_activity 
    WHERE state != 'idle' 
  `);
    console.log('Activity:', res2.rows);

    await client.end();
}
run();
