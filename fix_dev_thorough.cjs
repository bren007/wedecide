const { Client } = require('pg');
const connectionString = 'postgresql://postgres.dakkjqqfskzsymkclymw:CU6Y1D2V610cttXs@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

async function setup() {
    const client = new Client({ connectionString });
    await client.connect();
    try {
        console.log('Fixing DEV RLS policies thoroughly...');

        await client.query(`
      -- Drop EVERYTHING that could cause infinite recursion
      DROP POLICY IF EXISTS "Users can view roles in their organization" ON public.user_roles;
      DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
      DROP POLICY IF EXISTS "admins_select_org_roles" ON public.user_roles;
      DROP POLICY IF EXISTS "roles_read_own" ON public.user_roles;
      DROP POLICY IF EXISTS "select_own_roles" ON public.user_roles;

      DROP POLICY IF EXISTS "Users can view their own user record" ON public.users;
      DROP POLICY IF EXISTS "select_own_profile" ON public.users;
      DROP POLICY IF EXISTS "users_read_own" ON public.users;
      DROP POLICY IF EXISTS "users_select_own_and_org_members" ON public.users;
    `);

        // Let's rely on basic policies without complex joins for a moment just to test if this is the cause
        await client.query(`
      -- Basic users read policy
      CREATE POLICY "users_read_own" ON public.users
      FOR SELECT TO authenticated
      USING ( id = auth.uid()::text );

      -- Read org members safely without joins in the policy itself
      CREATE OR REPLACE FUNCTION public.get_auth_user_org_id_safe()
      RETURNS text
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT organization_id::text FROM public.users WHERE id = auth.uid()::text LIMIT 1;
      $$;

      CREATE POLICY "users_read_org" ON public.users
      FOR SELECT TO authenticated
      USING ( organization_id::text = public.get_auth_user_org_id_safe() );
      

      -- Basic user_roles policies
      CREATE POLICY "roles_read_own" ON public.user_roles
      FOR SELECT TO authenticated
      USING ( user_id::text = auth.uid()::text );

      CREATE POLICY "roles_read_org" ON public.user_roles
      FOR SELECT TO authenticated
      USING ( organization_id::text = public.get_auth_user_org_id_safe() );
    `);

        console.log('Thorough fix applied on DEV.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

setup();
