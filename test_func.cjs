const { Client } = require('pg');
async function test() {
    const client = new Client({ connectionString: 'postgresql://postgres.dakkjqqfskzsymkclymw:aSaZHIWiLiZsUbeX@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
    await client.connect();

    // Clean session
    await client.query("RESET ROLE");

    const userId = 'd8c194d8-7a54-4d4f-b524-0da518df8e4e';
    await client.query(`SELECT set_config('request.jwt.claims', '{"sub": "${userId}"}', true)`);
    await client.query(`SELECT set_config('request.jwt.claim.sub', '${userId}', true)`);
    await client.query("SET ROLE authenticated");

    try {
        const res = await client.query(`SELECT public.get_auth_user_org_id_safe() as org_id`);
        console.log("org_id:", res.rows[0]);
    } catch (e) {
        console.error(e.message);
    }

    await client.end();
}
test();
