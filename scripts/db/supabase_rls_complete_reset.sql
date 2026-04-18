-- Complete RLS Reset and Setup for Signup
-- This script removes ALL existing policies and creates only what's needed for signup

-- ============================================
-- STEP 1: Remove ALL existing policies
-- ============================================

-- Drop all policies on organizations
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organizations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON organizations';
    END LOOP;
END $$;

-- Drop all policies on users
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON users';
    END LOOP;
END $$;

-- Drop all policies on user_roles
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_roles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON user_roles';
    END LOOP;
END $$;

-- Drop all policies on decisions
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'decisions') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON decisions';
    END LOOP;
END $$;

-- Drop all policies on stakeholders
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'stakeholders') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON stakeholders';
    END LOOP;
END $$;

-- Drop all policies on documents
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'documents') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON documents';
    END LOOP;
END $$;

-- ============================================
-- STEP 2: Enable RLS on all tables
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create minimal policies for signup
-- ============================================

-- Organizations: Allow anyone to INSERT (for signup)
CREATE POLICY "signup_insert_org"
  ON organizations FOR INSERT
  TO public
  WITH CHECK (true);

-- Organizations: Allow authenticated users to SELECT their own org
CREATE POLICY "select_own_org"
  ON organizations FOR SELECT
  TO authenticated
  USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Users: Allow anyone to INSERT (for signup)
CREATE POLICY "signup_insert_user"
  ON users FOR INSERT
  TO public
  WITH CHECK (true);

-- Users: Allow authenticated users to SELECT their own profile
CREATE POLICY "select_own_profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- User Roles: Allow anyone to INSERT (for signup)
CREATE POLICY "signup_insert_role"
  ON user_roles FOR INSERT
  TO public
  WITH CHECK (true);

-- User Roles: Allow authenticated users to SELECT their own roles
CREATE POLICY "select_own_roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Decisions: Allow authenticated users full access to their org's decisions
CREATE POLICY "manage_org_decisions"
  ON decisions FOR ALL
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Stakeholders: Allow authenticated users to manage stakeholders for their org's decisions
CREATE POLICY "manage_stakeholders"
  ON stakeholders FOR ALL
  TO authenticated
  USING (decision_id IN (
    SELECT id FROM decisions WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ))
  WITH CHECK (decision_id IN (
    SELECT id FROM decisions WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

-- Documents: Allow authenticated users to manage documents for their org's decisions
CREATE POLICY "manage_documents"
  ON documents FOR ALL
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
