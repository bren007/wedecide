const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.dakkjqqfskzsymkclymw:CU6Y1D2V610cttXs@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
    await client.connect();
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'");
    console.log(res.rows);
    await client.end();
}
run();
