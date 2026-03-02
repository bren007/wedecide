
-- Fix ID types for meeting_groups table from TEXT to UUID

-- 1. Drop Policies First (Cannot alter columns used in policies)
DROP POLICY IF EXISTS "Users can view org meeting groups" ON meeting_groups;
DROP POLICY IF EXISTS "Admins can manage meeting groups" ON meeting_groups;

-- 2. Disable RLS temporarily
ALTER TABLE meeting_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE decision_rapid_roles DISABLE ROW LEVEL SECURITY;

-- 3. Drop dependent FKs (BOTH Downstream and Upstream)
ALTER TABLE decision_rapid_roles 
  DROP CONSTRAINT IF EXISTS decision_rapid_roles_meeting_group_id_fkey;

ALTER TABLE meeting_groups
  DROP CONSTRAINT IF EXISTS meeting_groups_organization_id_fkey;

-- 4. Convert dependent column FIRST (or concurrently)
ALTER TABLE decision_rapid_roles 
  ALTER COLUMN meeting_group_id TYPE UUID USING meeting_group_id::uuid;

-- 5. Convert main table columns
ALTER TABLE meeting_groups 
  ALTER COLUMN id TYPE UUID USING id::uuid;

ALTER TABLE meeting_groups 
  ALTER COLUMN organization_id TYPE UUID USING organization_id::uuid;

-- 6. Restore FKs
-- Downstream (Roles -> Group)
ALTER TABLE decision_rapid_roles
  ADD CONSTRAINT decision_rapid_roles_meeting_group_id_fkey
  FOREIGN KEY (meeting_group_id) REFERENCES meeting_groups(id) ON DELETE CASCADE;

-- Upstream (Group -> Org)
ALTER TABLE meeting_groups
  ADD CONSTRAINT meeting_groups_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- 7. Re-enable RLS
ALTER TABLE meeting_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_rapid_roles ENABLE ROW LEVEL SECURITY;

-- 8. Re-create RLS policies with correct types
CREATE POLICY "Users can view org meeting groups" 
ON meeting_groups FOR SELECT 
USING (organization_id IN (SELECT u.organization_id FROM users u WHERE u.id = auth.uid()));

CREATE POLICY "Admins can manage meeting groups" 
ON meeting_groups FOR ALL 
USING (
  organization_id IN (SELECT u.organization_id FROM users u WHERE u.id = auth.uid())
  AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'chair'))
);
