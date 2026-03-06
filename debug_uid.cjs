const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres.dakkjqqfskzsymkclymw:CU6Y1D2V610cttXs@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
    await client.connect();
    try {
        const userId = 'd8c194d8-7a54-4d4f-b524-0da518df8e4e';
        await client.query("SET ROLE authenticated");
        await client.query(`SELECT set_config('request.jwt.claims', '{"sub": "${userId}"}', true);`);
        await client.query(`SELECT set_config('request.jwt.claim.sub', '${userId}', true);`);

        // Check if auth.uid() returns the id properly
        const resUid = await client.query('SELECT auth.uid() as uid, auth.uid()::text as uid_text');
        console.log('auth.uid():', resUid.rows[0]);

        // Check exactly what the RLS evaluates to
        const resEval = await client.query(`SELECT id, id = auth.uid()::text as should_match FROM public.users WHERE id = '${userId}'`);
        console.log('Evaluating match:', resEval.rows[0]);

    } catch (e) {
        console.error(e);
    }
    await client.end();
}
run();
