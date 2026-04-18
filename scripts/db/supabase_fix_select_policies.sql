-- FIX SELECT POLICIES
-- The signup RPC creates data successfully, but the app cannot read it back
-- because the RLS SELECT policies are restricting access.

-- 1. Reset Policies for Users table
DROP POLICY IF EXISTS "final_user_select" ON users;
DROP POLICY IF EXISTS "user_select_authenticated" ON users;
DROP POLICY IF EXISTS "users_select_own_profile" ON users;
DROP POLICY IF EXISTS "users_select_own_org" ON organizations;

-- 2. Create CORRECT Select Policy for Users
-- Allow user to read their OWN profile
CREATE POLICY "users_read_own"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3. Create CORRECT Select Policy for Organizations
-- Allow user to read organizations they belong to
CREATE POLICY "orgs_read_own"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- 4. Create CORRECT Select Policy for User Roles
-- Allow user to read their own roles
CREATE POLICY "roles_read_own"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 6. Grant basic permissions to authenticated role (just in case)
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON user_roles TO authenticated;
