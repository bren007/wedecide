const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
    connectionString: 'postgresql://postgres.dakkjqqfskzsymkclymw:CU6Y1D2V610cttXs@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    await client.connect();
    try {
        const sqlContext = fs.readFileSync('rpc_update_leads.sql', 'utf8');
        await client.query(sqlContext);
        console.log('Ran rpc_update_leads.sql');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
