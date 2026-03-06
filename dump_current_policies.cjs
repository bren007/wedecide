const { Client } = require('pg');
async function dump() {
    const client = new Client({ connectionString: 'postgresql://postgres.dakkjqqfskzsymkclymw:CU6Y1D2V610cttXs@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
    await client.connect();
    const res = await client.query("select schemaname, tablename, policyname, roles, cmd, qual from pg_policies where schemaname = 'public' and tablename in ('users', 'user_roles')");
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
}
dump();
