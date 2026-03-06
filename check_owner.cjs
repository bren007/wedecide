const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.dakkjqqfskzsymkclymw:CU6Y1D2V610cttXs@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
    await client.connect();
    const res = await client.query("SELECT proname, proowner::regrole FROM pg_proc WHERE proname = 'get_auth_user_org_id_safe'");
    console.log(res.rows);
    await client.end();
}
run();
