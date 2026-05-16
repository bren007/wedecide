-- Fix for RLS Recursion in Staging
-- This script removes recursive policies and implements a safer way to check organization access.

-- 1. Helper Function: Get Org ID without recursion
-- We use SECURITY DEFINER and a specific search path to ensure it bypasses public RLS.
CREATE OR REPLACE FUNCTION public.get_auth_user_org_id()
RETURNS TEXT AS $$
  -- We query the table directly. Since this is SECURITY DEFINER and owned by postgres, 
  -- it will bypass RLS as long as we are careful.
  SELECT organization_id FROM public.users WHERE id = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, auth;

-- Also update the 'safe' version used in some policies
CREATE OR REPLACE FUNCTION public.get_auth_user_org_id_safe()
RETURNS TEXT AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, auth;

-- 2. Fix 'users' table policies
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_read_own" ON public.users;
DROP POLICY IF EXISTS "users_read_org" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "Users can update their own user record" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own user record" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;

-- Basic policies that avoid recursion
CREATE POLICY "users_self_access" ON public.users 
  FOR ALL USING (id = auth.uid()::text);

-- For reading others in the same org, we use the function which is now safe
CREATE POLICY "users_org_read" ON public.users
  FOR SELECT USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()::text));
-- Wait, the policy itself can't contain a query to the same table if it triggers RLS.
-- But if the sub-query is simple, Postgres sometimes handles it.
-- Better: use the function we just defined.
DROP POLICY IF EXISTS "users_org_read" ON public.users;
CREATE POLICY "users_org_read" ON public.users
  FOR SELECT USING (organization_id = get_auth_user_org_id());

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Fix 'user_roles' table policies
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_read_own" ON public.user_roles;
DROP POLICY IF EXISTS "roles_read_org" ON public.user_roles;
DROP POLICY IF EXISTS "admins_update_org_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins_delete_org_roles" ON public.user_roles;

CREATE POLICY "roles_self_read" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "roles_org_read" ON public.user_roles
  FOR SELECT USING (organization_id = get_auth_user_org_id());

-- For admin management, we need to check the role.
-- To avoid recursion, we check the role of the CURRENT user in a way that doesn't trigger RLS.
CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()::text 
    AND role IN ('admin', 'chair')
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, auth;

CREATE POLICY "admins_manage_roles" ON public.user_roles
  FOR ALL USING (
    organization_id = get_auth_user_org_id() AND is_org_admin()
  );

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Fix 'initiatives' table policies
ALTER TABLE public.initiatives DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View initiatives" ON public.initiatives;
DROP POLICY IF EXISTS "Propose initiatives" ON public.initiatives;
DROP POLICY IF EXISTS "Update own proposed initiatives" ON public.initiatives;
DROP POLICY IF EXISTS "Chair/Admin manage all initiatives" ON public.initiatives;

CREATE POLICY "initiatives_read" ON public.initiatives
  FOR SELECT USING (org_id = get_auth_user_org_id());

CREATE POLICY "initiatives_insert" ON public.initiatives
  FOR INSERT WITH CHECK (org_id = get_auth_user_org_id());

CREATE POLICY "initiatives_update_own" ON public.initiatives
  FOR UPDATE USING (
    org_id = get_auth_user_org_id() AND 
    owner_id = auth.uid()::text AND 
    status = 'proposed'
  );

CREATE POLICY "initiatives_admin_manage" ON public.initiatives
  FOR ALL USING (
    org_id = get_auth_user_org_id() AND is_org_admin()
  );

ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;

-- 5. Force Schema Cache Reload
NOTIFY pgrst, 'reload schema';
