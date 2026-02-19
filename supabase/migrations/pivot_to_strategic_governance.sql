-- Migration: Pivot to Strategic Governance Engine (UUID Corrected)

-- 1. Capacity Settings
CREATE TABLE IF NOT EXISTS capacity_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  total_focus_slots INTEGER NOT NULL DEFAULT 20,
  total_capex_limit NUMERIC NOT NULL DEFAULT 0,
  total_opex_limit NUMERIC NOT NULL DEFAULT 0,
  value_drop_horizon_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(org_id)
);

ALTER TABLE capacity_settings ENABLE ROW LEVEL SECURITY;

-- 2. Strategic Pillars
CREATE TABLE IF NOT EXISTS strategic_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_weight INTEGER NOT NULL DEFAULT 0, -- Percentage or weight
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE strategic_pillars ENABLE ROW LEVEL SECURITY;

-- 3. Initiatives
CREATE TABLE IF NOT EXISTS initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL, -- The Proposer
  title TEXT NOT NULL,
  focus_slots_required INTEGER NOT NULL DEFAULT 3,
  capex_required NUMERIC NOT NULL DEFAULT 0,
  opex_required NUMERIC NOT NULL DEFAULT 0,
  short_term_win BOOLEAN NOT NULL DEFAULT false,
  strategic_pillar_id UUID REFERENCES strategic_pillars(id), -- Optional link
  status TEXT NOT NULL DEFAULT 'proposed', -- proposed, approved, active, paused, archived, completed
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;

-- 4. Strategic Ledger (Audit/History)
CREATE TABLE IF NOT EXISTS strategic_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  initiative_id UUID REFERENCES initiatives(id) ON DELETE SET NULL,
  chair_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- create, update, swap, approve
  rationale TEXT,
  replaced_ids JSONB DEFAULT '[]'::jsonb, -- Array of initiative IDs that were swapped out
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE strategic_ledger ENABLE ROW LEVEL SECURITY;

-- 5. Leads (Public "Front Door")
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  org_name TEXT,
  pain_point TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Helper function to get current user's org_id
DROP FUNCTION IF EXISTS get_auth_user_org_id();
CREATE OR REPLACE FUNCTION get_auth_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Capacity Settings
DROP POLICY IF EXISTS "View capacity settings" ON capacity_settings;
CREATE POLICY "View capacity settings" ON capacity_settings
  FOR SELECT
  USING (org_id = get_auth_user_org_id());

DROP POLICY IF EXISTS "Manage capacity settings" ON capacity_settings;
CREATE POLICY "Manage capacity settings" ON capacity_settings
  FOR ALL
  USING (
    org_id = get_auth_user_org_id() AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND organization_id = capacity_settings.org_id
      AND role IN ('chair', 'admin')
    )
  );

-- Strategic Pillars
DROP POLICY IF EXISTS "View strategic pillars" ON strategic_pillars;
CREATE POLICY "View strategic pillars" ON strategic_pillars
  FOR SELECT
  USING (org_id = get_auth_user_org_id());

DROP POLICY IF EXISTS "Manage strategic pillars" ON strategic_pillars;
CREATE POLICY "Manage strategic pillars" ON strategic_pillars
  FOR ALL
  USING (
    org_id = get_auth_user_org_id() AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND organization_id = strategic_pillars.org_id
      AND role IN ('chair', 'admin')
    )
  );

-- Initiatives
DROP POLICY IF EXISTS "View initiatives" ON initiatives;
CREATE POLICY "View initiatives" ON initiatives
  FOR SELECT
  USING (org_id = get_auth_user_org_id());

DROP POLICY IF EXISTS "Propose initiatives" ON initiatives;
CREATE POLICY "Propose initiatives" ON initiatives
  FOR INSERT
  WITH CHECK (org_id = get_auth_user_org_id());
  -- Any member can propose

DROP POLICY IF EXISTS "Update own proposed initiatives" ON initiatives;
CREATE POLICY "Update own proposed initiatives" ON initiatives
  FOR UPDATE
  USING (
    org_id = get_auth_user_org_id() AND
    owner_id = auth.uid() AND
    status = 'proposed'
  );

DROP POLICY IF EXISTS "Chair/Admin manage all initiatives" ON initiatives;
CREATE POLICY "Chair/Admin manage all initiatives" ON initiatives
  FOR UPDATE
  USING (
    org_id = get_auth_user_org_id() AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND organization_id = initiatives.org_id
      AND role IN ('chair', 'admin')
    )
  );

-- Strategic Ledger
DROP POLICY IF EXISTS "View ledger" ON strategic_ledger;
CREATE POLICY "View ledger" ON strategic_ledger
  FOR SELECT
  USING (org_id = get_auth_user_org_id());

DROP POLICY IF EXISTS "Append to ledger" ON strategic_ledger;
CREATE POLICY "Append to ledger" ON strategic_ledger
  FOR INSERT
  WITH CHECK (
    org_id = get_auth_user_org_id() AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND organization_id = strategic_ledger.org_id
      AND role IN ('chair', 'admin')
    )
  );

-- Leads (Public Access)
DROP POLICY IF EXISTS "Public insert leads" ON leads;
CREATE POLICY "Public insert leads" ON leads
  FOR INSERT
  WITH CHECK (true);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_capacity_settings_updated_at ON capacity_settings;
CREATE TRIGGER update_capacity_settings_updated_at BEFORE UPDATE ON capacity_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_strategic_pillars_updated_at ON strategic_pillars;
CREATE TRIGGER update_strategic_pillars_updated_at BEFORE UPDATE ON strategic_pillars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_initiatives_updated_at ON initiatives;
CREATE TRIGGER update_initiatives_updated_at BEFORE UPDATE ON initiatives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
