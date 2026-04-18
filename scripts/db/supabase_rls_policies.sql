-- WeDecide Lite Row Level Security Policies
-- Run this SQL in Supabase SQL Editor AFTER creating the tables
-- Run for both dev and staging projects

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Users: Can only see users in their organization
CREATE POLICY "Users can view org members"
  ON users FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- User can view their own record
CREATE POLICY "Users can view own record"
  ON users FOR SELECT
  USING (id = auth.uid());

-- User can update their own record
CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- User Roles: Can view roles in their organization
CREATE POLICY "Users can view org roles"
  ON user_roles FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Decisions: Users can only see decisions in their organization
CREATE POLICY "Users can view org decisions"
  ON decisions FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Users can create decisions in their organization
CREATE POLICY "Users can create decisions"
  ON decisions FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Users can update their own decisions or if they are admin/chair
CREATE POLICY "Users can update own decisions"
  ON decisions FOR UPDATE
  USING (
    owner_id = auth.uid() 
    OR organization_id IN (
      SELECT ur.organization_id FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'chair')
    )
  );

-- Users can delete their own decisions or if they are admin/chair
CREATE POLICY "Users can delete own decisions"
  ON decisions FOR DELETE
  USING (
    owner_id = auth.uid() 
    OR organization_id IN (
      SELECT ur.organization_id FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'chair')
    )
  );

-- Documents: Scoped to organization
CREATE POLICY "Users can view org documents"
  ON documents FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create documents"
  ON documents FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  USING (uploaded_by = auth.uid());

-- Stakeholders: Can view assigned decisions
CREATE POLICY "Stakeholders can view assigned decisions"
  ON decisions FOR SELECT
  USING (id IN (
    SELECT decision_id FROM stakeholders WHERE email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  ));

-- Stakeholders: Users can view stakeholders for their org decisions
CREATE POLICY "Users can view stakeholders"
  ON stakeholders FOR SELECT
  USING (decision_id IN (
    SELECT id FROM decisions WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can create stakeholders"
  ON stakeholders FOR INSERT
  WITH CHECK (decision_id IN (
    SELECT id FROM decisions WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete stakeholders"
  ON stakeholders FOR DELETE
  USING (decision_id IN (
    SELECT id FROM decisions WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));
