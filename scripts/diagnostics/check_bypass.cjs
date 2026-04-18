const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.dakkjqqfskzsymkclymw:CU6Y1D2V610cttXs@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
    await client.connect();
    const res = await client.query("SELECT rolname, rolbypassrls, rolsuper FROM pg_roles WHERE rolname = current_user");
    console.log(res.rows);
    await client.end();
}
run();
