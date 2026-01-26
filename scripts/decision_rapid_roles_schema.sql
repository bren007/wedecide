-- Decision RAPID Roles Table
-- Stores RAPID role assignments for decisions
-- R (Recommend), A (Agree), P (Perform), I (Input), D (Decide)

CREATE TABLE IF NOT EXISTS decision_rapid_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('recommend', 'agree', 'perform', 'input', 'decide')),
  
  -- One of these must be set: user_id, external_name, or meeting_group_id
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  external_name TEXT,
  external_role TEXT, -- Optional role/title for external people
  meeting_group_id UUID REFERENCES meeting_groups(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure at least one identifier is set
  CONSTRAINT at_least_one_identifier CHECK (
    user_id IS NOT NULL OR 
    external_name IS NOT NULL OR 
    meeting_group_id IS NOT NULL
  )
);

-- Enable RLS
ALTER TABLE decision_rapid_roles ENABLE ROW LEVEL SECURITY;

-- Users can view RAPID roles for decisions in their organization
DROP POLICY IF EXISTS "Users can view decision RAPID roles" ON decision_rapid_roles;
CREATE POLICY "Users can view decision RAPID roles" 
ON decision_rapid_roles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM decisions d 
    WHERE d.id = decision_rapid_roles.decision_id 
    AND d.organization_id IN (SELECT u.organization_id FROM users u WHERE u.id = auth.uid()::text)
  )
);

-- Decision owners and admins/chairs can manage RAPID roles
DROP POLICY IF EXISTS "Decision owners and admins can manage RAPID roles" ON decision_rapid_roles;
CREATE POLICY "Decision owners and admins can manage RAPID roles" 
ON decision_rapid_roles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM decisions d 
    WHERE d.id = decision_rapid_roles.decision_id 
    AND d.organization_id IN (SELECT u.organization_id FROM users u WHERE u.id = auth.uid()::text)
    AND (
      d.owner_id = auth.uid()::text OR
      EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair'))
    )
  )
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_rapid_roles_decision ON decision_rapid_roles(decision_id);
CREATE INDEX IF NOT EXISTS idx_rapid_roles_user ON decision_rapid_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_rapid_roles_meeting_group ON decision_rapid_roles(meeting_group_id);
