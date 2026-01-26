-- Meeting Groups Table
-- Stores organization meeting groups (e.g., "Board", "Finance Committee")
-- Managed by admins/chairs and used in RAPID D (Decide) role

CREATE TABLE IF NOT EXISTS meeting_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE meeting_groups ENABLE ROW LEVEL SECURITY;

-- Users can view meeting groups in their organization
DROP POLICY IF EXISTS "Users can view org meeting groups" ON meeting_groups;
CREATE POLICY "Users can view org meeting groups" 
ON meeting_groups FOR SELECT 
USING (organization_id IN (SELECT u.organization_id FROM users u WHERE u.id = auth.uid()::text));

-- Admins/chairs can manage meeting groups
DROP POLICY IF EXISTS "Admins can manage meeting groups" ON meeting_groups;
CREATE POLICY "Admins can manage meeting groups" 
ON meeting_groups FOR ALL 
USING (
  organization_id IN (SELECT u.organization_id FROM users u WHERE u.id = auth.uid()::text)
  AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_meeting_groups_org ON meeting_groups(organization_id);
