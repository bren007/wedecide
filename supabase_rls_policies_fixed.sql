-- WeDecide Lite Row Level Security Policies - FIXED
-- Run this SQL in Supabase SQL Editor to REPLACE the existing policies
-- This fixes the infinite recursion issue

-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view org members" ON users;
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Users can view org roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view org decisions" ON decisions;
DROP POLICY IF EXISTS "Users can create decisions" ON decisions;
DROP POLICY IF EXISTS "Users can update own decisions" ON decisions;
DROP POLICY IF EXISTS "Users can delete own decisions" ON decisions;
DROP POLICY IF EXISTS "Users can view org documents" ON documents;
DROP POLICY IF EXISTS "Users can create documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
DROP POLICY IF EXISTS "Stakeholders can view assigned decisions" ON decisions;
DROP POLICY IF EXISTS "Users can view stakeholders" ON stakeholders;
DROP POLICY IF EXISTS "Users can create stakeholders" ON stakeholders;
DROP POLICY IF EXISTS "Users can delete stakeholders" ON stakeholders;

-- Disable RLS temporarily to recreate policies
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE decisions DISABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholders DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- USERS TABLE POLICIES (base policies - no recursion)
-- Users can view their own record
CREATE POLICY "Users can view own record"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Users can update their own record
CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- ORGANIZATIONS TABLE POLICIES
-- Users can view their organization (using direct user lookup, no recursion)
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (
    id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- USER ROLES TABLE POLICIES
-- Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- DECISIONS TABLE POLICIES
-- Users can view decisions in their organization
CREATE POLICY "Users can view org decisions"
  ON decisions FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Users can create decisions in their organization
CREATE POLICY "Users can create decisions"
  ON decisions FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Users can update their own decisions or if they are admin/chair
CREATE POLICY "Users can update decisions"
  ON decisions FOR UPDATE
  USING (
    owner_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND organization_id = decisions.organization_id 
      AND role IN ('admin', 'chair')
    )
  );

-- Users can delete their own decisions or if they are admin/chair
CREATE POLICY "Users can delete decisions"
  ON decisions FOR DELETE
  USING (
    owner_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND organization_id = decisions.organization_id 
      AND role IN ('admin', 'chair')
    )
  );

-- DOCUMENTS TABLE POLICIES
-- Users can view documents in their organization
CREATE POLICY "Users can view org documents"
  ON documents FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Users can create documents in their organization
CREATE POLICY "Users can create documents"
  ON documents FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  USING (uploaded_by = auth.uid());

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  USING (uploaded_by = auth.uid());

-- STAKEHOLDERS TABLE POLICIES
-- Users can view stakeholders for decisions in their org
CREATE POLICY "Users can view stakeholders"
  ON stakeholders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decisions 
      WHERE decisions.id = stakeholders.decision_id 
      AND decisions.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

-- Users can create stakeholders for decisions in their org
CREATE POLICY "Users can create stakeholders"
  ON stakeholders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM decisions 
      WHERE decisions.id = stakeholders.decision_id 
      AND decisions.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

-- Users can delete stakeholders for decisions in their org
CREATE POLICY "Users can delete stakeholders"
  ON stakeholders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM decisions 
      WHERE decisions.id = stakeholders.decision_id 
      AND decisions.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

-- Note: Stakeholder read-only access to decisions will be handled at the application level
-- since we're using Supabase Auth which links users to the users table
