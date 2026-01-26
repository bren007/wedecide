-- ============================================
-- Enable RLS for Meetings, Agenda Items, and Affected Parties
-- STAGING VERSION - Compatible with UUID auth.uid()
-- ============================================
-- This migration adds Row Level Security policies to prevent
-- cross-organization data access vulnerabilities.

-- ============================================
-- STEP 1: Enable RLS on all three tables
-- ============================================

ALTER TABLE affected_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Drop existing policies (if any)
-- ============================================

DROP POLICY IF EXISTS "Users can view affected_parties of their org decisions" ON affected_parties;
DROP POLICY IF EXISTS "Decision owners can add affected_parties" ON affected_parties;
DROP POLICY IF EXISTS "Decision owners can remove affected_parties" ON affected_parties;

DROP POLICY IF EXISTS "Users can view org meetings" ON meetings;
DROP POLICY IF EXISTS "Admins can manage meetings" ON meetings;

DROP POLICY IF EXISTS "Users can view agenda items" ON agenda_items;
DROP POLICY IF EXISTS "Admins can manage agenda items" ON agenda_items;

-- ============================================
-- STEP 3: Affected Parties Policies
-- ============================================

-- View: Members of the same organization (via the decision's organization)
CREATE POLICY "Users can view affected_parties of their org decisions"
ON affected_parties FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM decisions d
    JOIN users u ON u.organization_id = d.organization_id
    WHERE d.id = affected_parties.decision_id
    AND u.id = auth.uid()
  )
);

-- Insert: Decision Owner only
CREATE POLICY "Decision owners can add affected_parties"
ON affected_parties FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM decisions d
    WHERE d.id = affected_parties.decision_id
    AND d.owner_id = auth.uid()
  )
);

-- Delete: Decision Owner only
CREATE POLICY "Decision owners can remove affected_parties"
ON affected_parties FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM decisions d
    WHERE d.id = affected_parties.decision_id
    AND d.owner_id = auth.uid()
  )
);

-- ============================================
-- STEP 4: Meetings Policies
-- ============================================

-- View: All users in the organization can view meetings
CREATE POLICY "Users can view org meetings"
ON meetings FOR SELECT
USING (
  organization_id IN (
    SELECT u.organization_id 
    FROM users u 
    WHERE u.id = auth.uid()
  )
);

-- Manage: Only Admins and Chairs can create, update, delete meetings
CREATE POLICY "Admins can manage meetings"
ON meetings FOR ALL
USING (
  organization_id IN (
    SELECT u.organization_id 
    FROM users u 
    WHERE u.id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'chair')
  )
);

-- ============================================
-- STEP 5: Agenda Items Policies
-- ============================================

-- View: All users can view agenda items for meetings in their organization
CREATE POLICY "Users can view agenda items"
ON agenda_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = agenda_items.meeting_id
    AND m.organization_id IN (
      SELECT u.organization_id 
      FROM users u 
      WHERE u.id = auth.uid()
    )
  )
);

-- Manage: Only Admins and Chairs can create, update, delete agenda items
CREATE POLICY "Admins can manage agenda items"
ON agenda_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = agenda_items.meeting_id
    AND m.organization_id IN (
      SELECT u.organization_id 
      FROM users u 
      WHERE u.id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'chair')
    )
  )
);
