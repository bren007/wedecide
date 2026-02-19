
-- Fix Admin RLS Policies for User Roles
-- Enables Admins and Chairs to manage roles within their organization

-- 1. Policy for Admins/Chairs to SELECT all roles in their org
DROP POLICY IF EXISTS "admins_select_org_roles" ON user_roles;
CREATE POLICY "admins_select_org_roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'chair')
    )
  );

-- 2. Policy for Admins/Chairs to UPDATE roles in their org
DROP POLICY IF EXISTS "admins_update_org_roles" ON user_roles;
CREATE POLICY "admins_update_org_roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'chair')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- 3. Policy for Admins/Chairs to DELETE roles (Remove member)
DROP POLICY IF EXISTS "admins_delete_org_roles" ON user_roles;
CREATE POLICY "admins_delete_org_roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'chair')
    )
  );
