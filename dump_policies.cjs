const { Client } = require('pg');
const fs = require('fs');

async function dump() {
    const client = new Client({ connectionString: 'postgresql://postgres.bxiylyhkxdyreveervhj:XA%2Ay%3F47%3Ff3YbY%243@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=no-verify' });
    await client.connect();
    const res = await client.query(`
    select schemaname, tablename, policyname, roles, cmd, qual, with_check 
    from pg_policies 
    where schemaname = 'public' and tablename in ('users', 'user_roles');
  `);
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
}
dump();
