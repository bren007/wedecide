-- Fix for RLS Recursion (v2)
-- This script disables FORCE RLS if it's on, and simplifies the policies to be non-recursive.

-- 1. Ensure we don't have FORCE RLS which breaks SECURITY DEFINER bypass
ALTER TABLE public.users NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles NO FORCE ROW LEVEL SECURITY;

-- 2. Redefine the function to be as simple as possible
CREATE OR REPLACE FUNCTION public.get_auth_user_org_id()
RETURNS TEXT AS $$
  -- We use a subquery with LIMIT 1 to be fast.
  -- Since this is SECURITY DEFINER, it should bypass RLS now that NO FORCE is set.
  SELECT organization_id FROM public.users WHERE id = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Simplified policies that use a 'base case' for recursion
-- For SELECT, we allow the user to see their own record ALWAYS without calling the function.
DROP POLICY IF EXISTS "users_self_access" ON public.users;
CREATE POLICY "users_self_access" ON public.users 
  FOR ALL USING (id = auth.uid()::text);

-- For reading others in the same org, we call the function.
-- Since the user's own record is covered by 'users_self_access', 
-- and the function is SECURITY DEFINER, it should be safe.
DROP POLICY IF EXISTS "users_org_read" ON public.users;
CREATE POLICY "users_org_read" ON public.users
  FOR SELECT USING (organization_id = get_auth_user_org_id());

-- 4. Initiatives fix
-- Make sure initiatives don't cause their own recursion
DROP POLICY IF EXISTS "initiatives_read" ON public.initiatives;
CREATE POLICY "initiatives_read" ON public.initiatives
  FOR SELECT USING (org_id = get_auth_user_org_id());

-- 5. Force reload
NOTIFY pgrst, 'reload schema';
