-- Manual Schema Fix for Staging
-- Consolidates missing migrations that failed to push via Prisma

-- 1. Add Reversibility Type to Decisions
ALTER TABLE decisions 
ADD COLUMN IF NOT EXISTS reversibility_type TEXT CHECK (reversibility_type IN ('type1_irreversible', 'type2_reversible'));

CREATE INDEX IF NOT EXISTS idx_decisions_reversibility ON decisions(reversibility_type);

-- 2. Create Meeting Groups Table
CREATE TABLE IF NOT EXISTS meeting_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE meeting_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org meeting groups" ON meeting_groups;
CREATE POLICY "Users can view org meeting groups" 
ON meeting_groups FOR SELECT 
USING (organization_id::text IN (SELECT u.organization_id::text FROM users u WHERE u.id::text = auth.uid()::text));

DROP POLICY IF EXISTS "Admins can manage meeting groups" ON meeting_groups;
CREATE POLICY "Admins can manage meeting groups" 
ON meeting_groups FOR ALL 
USING (
  organization_id::text IN (SELECT u.organization_id::text FROM users u WHERE u.id::text = auth.uid()::text)
  AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id::text = auth.uid()::text AND ur.role IN ('admin', 'chair'))
);

CREATE INDEX IF NOT EXISTS idx_meeting_groups_org ON meeting_groups(organization_id);

-- 3. Create Decision RAPID Roles Table
CREATE TABLE IF NOT EXISTS decision_rapid_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('recommend', 'agree', 'perform', 'input', 'decide')),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  external_name TEXT,
  external_role TEXT,
  meeting_group_id UUID REFERENCES meeting_groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT at_least_one_identifier CHECK (user_id IS NOT NULL OR external_name IS NOT NULL OR meeting_group_id IS NOT NULL)
);

ALTER TABLE decision_rapid_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view decision RAPID roles" ON decision_rapid_roles;
CREATE POLICY "Users can view decision RAPID roles" 
ON decision_rapid_roles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM decisions d 
    WHERE d.id::text = decision_rapid_roles.decision_id::text 
    AND d.organization_id::text IN (SELECT u.organization_id::text FROM users u WHERE u.id::text = auth.uid()::text)
  )
);

DROP POLICY IF EXISTS "Decision owners and admins can manage RAPID roles" ON decision_rapid_roles;
CREATE POLICY "Decision owners and admins can manage RAPID roles" 
ON decision_rapid_roles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM decisions d 
    WHERE d.id::text = decision_rapid_roles.decision_id::text 
    AND d.organization_id::text IN (SELECT u.organization_id::text FROM users u WHERE u.id::text = auth.uid()::text)
    AND (
      d.owner_id::text = auth.uid()::text OR 
      EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id::text = auth.uid()::text AND ur.role IN ('admin', 'chair'))
    )
  )
);
