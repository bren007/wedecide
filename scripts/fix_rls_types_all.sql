
-- Global RLS & Schema Repair (Ordered Correctly)

-- 0. DROP ALL POLICIES FIRST (To unlock columns for alteration)
DROP POLICY IF EXISTS "Users can view org meeting groups" ON meeting_groups;
DROP POLICY IF EXISTS "Admins can manage meeting groups" ON meeting_groups;

DROP POLICY IF EXISTS "select_own_org" ON organizations;
DROP POLICY IF EXISTS "signup_insert_org" ON organizations;
DROP POLICY IF EXISTS "admins_update_org" ON organizations;

DROP POLICY IF EXISTS "select_own_profile" ON users;

DROP POLICY IF EXISTS "select_own_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_select_org_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_update_org_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_delete_org_roles" ON user_roles;

-- 1. Schema Changes (Revert to TEXT to match canonical state)
ALTER TABLE decision_rapid_roles DROP CONSTRAINT IF EXISTS decision_rapid_roles_meeting_group_id_fkey;
ALTER TABLE meeting_groups DROP CONSTRAINT IF EXISTS meeting_groups_organization_id_fkey;

-- Use USING ::text to ensure valid cast if currently UUID
ALTER TABLE meeting_groups ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE meeting_groups ALTER COLUMN organization_id TYPE TEXT USING organization_id::text;
ALTER TABLE decision_rapid_roles ALTER COLUMN meeting_group_id TYPE TEXT USING meeting_group_id::text;

ALTER TABLE meeting_groups 
  ADD CONSTRAINT meeting_groups_organization_id_fkey 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE decision_rapid_roles
  ADD CONSTRAINT decision_rapid_roles_meeting_group_id_fkey
  FOREIGN KEY (meeting_group_id) REFERENCES meeting_groups(id) ON DELETE CASCADE;

-- Ensure RLS is Enabled
ALTER TABLE meeting_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_rapid_roles ENABLE ROW LEVEL SECURITY;

-- 2. Helper Function (Bypasses RLS to stop recursion)
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id::text = auth.uid()::text 
    AND organization_id = org_id
    AND role IN ('admin', 'chair')
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.is_org_admin TO authenticated;

-- 3. Re-create Policies (Robust & Non-Recursive)

-- Organizations
CREATE POLICY "select_own_org" ON organizations FOR SELECT TO authenticated
USING (id IN (SELECT organization_id FROM users WHERE id::text = auth.uid()::text));

CREATE POLICY "signup_insert_org" ON organizations FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "admins_update_org" ON organizations FOR UPDATE TO authenticated
USING (public.is_org_admin(id))
WITH CHECK (public.is_org_admin(id));

-- Users
CREATE POLICY "select_own_profile" ON users FOR SELECT TO authenticated
USING (id::text = auth.uid()::text);

-- User Roles
CREATE POLICY "select_own_roles" ON user_roles FOR SELECT TO authenticated
USING (user_id::text = auth.uid()::text);

CREATE POLICY "admins_select_org_roles" ON user_roles FOR SELECT TO authenticated
USING (public.is_org_admin(organization_id));

CREATE POLICY "admins_update_org_roles" ON user_roles FOR UPDATE TO authenticated
USING (public.is_org_admin(organization_id))
WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "admins_delete_org_roles" ON user_roles FOR DELETE TO authenticated
USING (public.is_org_admin(organization_id));

-- Meeting Groups
CREATE POLICY "Users can view org meeting groups" ON meeting_groups FOR SELECT 
USING (organization_id IN (SELECT u.organization_id FROM users u WHERE u.id::text = auth.uid()::text));

CREATE POLICY "Admins can manage meeting groups" ON meeting_groups FOR ALL 
USING (public.is_org_admin(organization_id));
