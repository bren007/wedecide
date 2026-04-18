const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres.dakkjqqfskzsymkclymw:CU6Y1D2V610cttXs@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    await client.connect();
    try {
        const { rows } = await client.query(`
          SELECT * FROM pg_policies WHERE tablename = 'leads';
      `);
        console.log('Policies:', rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
