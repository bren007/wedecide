const { Client } = require('pg');
const connectionString = 'postgresql://postgres.dakkjqqfskzsymkclymw:CU6Y1D2V610cttXs@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

async function setup() {
    const client = new Client({ connectionString });
    await client.connect();
    try {
        console.log('Fixing dev policies...');

        await client.query(`
      CREATE OR REPLACE FUNCTION public.get_auth_user_org_id_safe()
      RETURNS text
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT organization_id::text FROM public.users WHERE id = auth.uid()::text LIMIT 1;
      $$;
    `);

        await client.query(`
      CREATE OR REPLACE FUNCTION public.is_org_admin(org_id text)
      RETURNS boolean
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id::text = auth.uid()::text 
          AND organization_id::text = org_id 
          AND role IN ('admin', 'chair')
        );
      $$;
    `);

        await client.query(`
      DROP POLICY IF EXISTS "users_select_own_and_org_members" ON public.users;
      DROP POLICY IF EXISTS "Users can view roles in their organization" ON public.user_roles;
    `);

        await client.query(`
      CREATE POLICY "users_select_own_and_org_members" ON public.users
      FOR SELECT TO authenticated
      USING (
        id = auth.uid()::text 
        OR organization_id::text = public.get_auth_user_org_id_safe()
      );
    `);

        await client.query(`
      CREATE POLICY "Users can view roles in their organization" ON public.user_roles
      FOR SELECT TO authenticated
      USING (
        organization_id::text = public.get_auth_user_org_id_safe()
      );
    `);

        console.log('Done fixing dev policies.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

setup();
