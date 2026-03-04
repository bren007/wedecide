const { Client } = require('pg');
async function dump() {
    const client = new Client({ connectionString: 'postgresql://postgres.dakkjqqfskzsymkclymw:CU6Y1D2V610cttXs@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
    await client.connect();
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
    console.log(JSON.stringify(res.rows, null, 2));

    const res2 = await client.query("SELECT * FROM users WHERE id = 'd8c194d8-7a54-4d4f-b524-0da518df8e4e'");
    console.log('Rows bypassed:', res2.rows);
    await client.end();
}
dump();
