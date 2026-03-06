-- Fix infinite recursion in user_roles RLS policies

-- 1. Create a SECURITY DEFINER function to bypass RLS for role checks
CREATE OR REPLACE FUNCTION public.is_admin_or_chair()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'chair')
  );
$$;

-- 2. Drop the problematic policies
DROP POLICY IF EXISTS "admins_select_org_roles" ON "public"."user_roles";
DROP POLICY IF EXISTS "admins_update_org_roles" ON "public"."user_roles";
DROP POLICY IF EXISTS "admins_delete_org_roles" ON "public"."user_roles";

-- 3. Recreate the policies using the new function
CREATE POLICY "admins_select_org_roles"
ON "public"."user_roles"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ) AND is_admin_or_chair()
);

CREATE POLICY "admins_update_org_roles"
ON "public"."user_roles"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ) AND is_admin_or_chair()
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "admins_delete_org_roles"
ON "public"."user_roles"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ) AND is_admin_or_chair()
);

-- Additionally, let's clean up some duplicate policies on `users` table
DROP POLICY IF EXISTS "select_own_profile" ON "public"."users";
DROP POLICY IF EXISTS "users_read_own" ON "public"."users";
DROP POLICY IF EXISTS "users_update_own" ON "public"."users";
