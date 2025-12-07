-- Invitations Table and Policies

-- 1. Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- member, admin, etc.
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'), -- Secure random token
  status TEXT DEFAULT 'pending' NOT NULL, -- pending, accepted, expired
  invited_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_org_id ON invitations(organization_id);

-- 3. RLS Policies
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Admins can VIEW invitations for their organization
CREATE POLICY "Admins can view invitations"
  ON invitations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND organization_id = invitations.organization_id 
      AND role IN ('admin', 'chair')
    )
  );

-- Admins can INSERT invitations for their organization
CREATE POLICY "Admins can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
       SELECT 1 FROM user_roles 
       WHERE user_id = auth.uid() 
       AND organization_id = invitations.organization_id 
       AND role IN ('admin', 'chair')
    )
  );

-- Admins can DELETE invitations
CREATE POLICY "Admins can delete invitations"
  ON invitations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
       SELECT 1 FROM user_roles 
       WHERE user_id = auth.uid() 
       AND organization_id = invitations.organization_id 
       AND role IN ('admin', 'chair')
    )
  );
