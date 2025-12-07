-- FIX INFINITE RECURSION
-- The previous policy caused the database to loop infinitely when checking permissions.
-- We fix this by creating a "Security Definer" function that bypasses RLS for the lookup.

-- 1. Create a secure helper function to get the current user's organization
-- SECURITY DEFINER means this runs with admin privileges, bypassing RLS on the SELECT
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "Users can see organization members" ON public.users;

-- 3. Create the new, safe policy using the function
CREATE POLICY "Users can see organization members" 
ON public.users 
FOR SELECT 
USING (
  organization_id = get_my_org_id()
);
