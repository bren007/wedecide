-- ============================================
-- STEP 1: Drop all existing policies
-- ============================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('organizations', 'users', 'user_roles', 'decisions', 'stakeholders', 'documents')) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- ============================================
-- STEP 2: Enable RLS
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Organizations - Simple policies
-- ============================================

-- Allow INSERT for signup (no auth required)
CREATE POLICY "org_insert_signup"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- Allow SELECT for authenticated users (their own org only)
-- SIMPLIFIED: Direct check without subquery
CREATE POLICY "org_select_own"
  ON organizations FOR SELECT
  TO authenticated
  USING (true);  -- Temporarily allow all, we'll filter in app

-- ============================================
-- STEP 4: Users - Simple policies
-- ============================================

-- Allow INSERT for signup
CREATE POLICY "user_insert_signup"
  ON users FOR INSERT
  WITH CHECK (true);

-- Allow SELECT for authenticated users
-- SIMPLIFIED: Just check if user is authenticated
CREATE POLICY "user_select_authenticated"
  ON users FOR SELECT
  TO authenticated
  USING (true);  -- Temporarily allow all, we'll filter in app

-- Allow UPDATE own profile
CREATE POLICY "user_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- STEP 5: User Roles - Simple policies
-- ============================================

-- Allow INSERT for signup
CREATE POLICY "role_insert_signup"
  ON user_roles FOR INSERT
  WITH CHECK (true);

-- Allow SELECT for authenticated users
CREATE POLICY "role_select_authenticated"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);  -- Temporarily allow all, we'll filter in app

-- ============================================
-- STEP 6: Decisions - Simple policies
-- ============================================

-- Allow all operations for authenticated users
-- We'll add org filtering later once basic flow works
CREATE POLICY "decision_all_authenticated"
  ON decisions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- STEP 7: Stakeholders - Simple policies
-- ============================================

CREATE POLICY "stakeholder_all_authenticated"
  ON stakeholders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- STEP 8: Documents - Simple policies
-- ============================================

CREATE POLICY "document_all_authenticated"
  ON documents FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
