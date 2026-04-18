-- Production-Ready RLS Policies for WeDecide
-- This configuration allows signup while maintaining security

-- ============================================
-- STEP 1: Enable RLS on all tables
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Organizations Table Policies
-- ============================================

-- Allow anyone to INSERT during signup (anon users)
-- This is needed because signup happens before authentication
CREATE POLICY "allow_signup_org_insert"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to SELECT their own organization
CREATE POLICY "users_select_own_org"
  ON organizations FOR SELECT
  TO authenticated
  USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Allow authenticated users to UPDATE their own organization
CREATE POLICY "users_update_own_org"
  ON organizations FOR UPDATE
  TO authenticated
  USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid()))
  WITH CHECK (id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ============================================
-- STEP 3: Users Table Policies
-- ============================================

-- Allow anyone to INSERT during signup
CREATE POLICY "allow_signup_user_insert"
  ON users FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to SELECT their own profile
CREATE POLICY "users_select_own_profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow authenticated users to SELECT other users in their org
CREATE POLICY "users_select_org_members"
  ON users FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Allow authenticated users to UPDATE their own profile
CREATE POLICY "users_update_own_profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- STEP 4: User Roles Table Policies
-- ============================================

-- Allow anyone to INSERT during signup
CREATE POLICY "allow_signup_role_insert"
  ON user_roles FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to SELECT their own roles
CREATE POLICY "users_select_own_roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow authenticated users to SELECT roles in their org
CREATE POLICY "users_select_org_roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Allow admins to INSERT new roles in their org
CREATE POLICY "admins_insert_org_roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT ur.organization_id FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- ============================================
-- STEP 5: Decisions Table Policies
-- ============================================

-- Allow authenticated users to SELECT decisions in their org
CREATE POLICY "users_select_org_decisions"
  ON decisions FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Allow authenticated users to INSERT decisions in their org
CREATE POLICY "users_insert_org_decisions"
  ON decisions FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Allow users to UPDATE their own decisions or if they're admin/chair
CREATE POLICY "users_update_decisions"
  ON decisions FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() 
    OR organization_id IN (
      SELECT ur.organization_id FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'chair')
    )
  )
  WITH CHECK (
    owner_id = auth.uid() 
    OR organization_id IN (
      SELECT ur.organization_id FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'chair')
    )
  );

-- Allow users to DELETE their own decisions or if they're admin/chair
CREATE POLICY "users_delete_decisions"
  ON decisions FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() 
    OR organization_id IN (
      SELECT ur.organization_id FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'chair')
    )
  );

-- ============================================
-- STEP 6: Stakeholders Table Policies
-- ============================================

-- Allow authenticated users to SELECT stakeholders for their org's decisions
CREATE POLICY "users_select_stakeholders"
  ON stakeholders FOR SELECT
  TO authenticated
  USING (decision_id IN (
    SELECT id FROM decisions WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

-- Allow authenticated users to INSERT stakeholders for their org's decisions
CREATE POLICY "users_insert_stakeholders"
  ON stakeholders FOR INSERT
  TO authenticated
  WITH CHECK (decision_id IN (
    SELECT id FROM decisions WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

-- Allow authenticated users to DELETE stakeholders for their org's decisions
CREATE POLICY "users_delete_stakeholders"
  ON stakeholders FOR DELETE
  TO authenticated
  USING (decision_id IN (
    SELECT id FROM decisions WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

-- ============================================
-- STEP 7: Documents Table Policies
-- ============================================

-- Allow authenticated users to SELECT documents in their org
CREATE POLICY "users_select_org_documents"
  ON documents FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Allow authenticated users to INSERT documents in their org
CREATE POLICY "users_insert_org_documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Allow users to UPDATE their own documents
CREATE POLICY "users_update_own_documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- Allow users to DELETE their own documents
CREATE POLICY "users_delete_own_documents"
  ON documents FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());
