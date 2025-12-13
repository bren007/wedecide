-- Enable RLS on core Phase 2 tables
ALTER TABLE "decisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stakeholders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;

-- CLEANUP: Remove strict old policies to ensure clean slate
-- Found in Audit:
DROP POLICY IF EXISTS "Users can view decisions in their organization" ON "decisions";
DROP POLICY IF EXISTS "Users can create decisions in their organization" ON "decisions";
DROP POLICY IF EXISTS "Users can update decisions in their organization" ON "decisions";
DROP POLICY IF EXISTS "Users can view stakeholders for decisions in their organization" ON "stakeholders";
DROP POLICY IF EXISTS "Users can create stakeholders" ON "stakeholders";

-- Previous attempts cleanup:
DROP POLICY IF EXISTS "Enable read access for all users" ON "decisions";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "decisions";
DROP POLICY IF EXISTS "Enable update for users based on email" ON "decisions";
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "decisions";
DROP POLICY IF EXISTS "Users can view decisions of their organization" ON "decisions";
DROP POLICY IF EXISTS "Users can create decisions for their organization" ON "decisions";
DROP POLICY IF EXISTS "Owners can update their decisions" ON "decisions";
DROP POLICY IF EXISTS "Owners can delete their decisions" ON "decisions";
DROP POLICY IF EXISTS "Users can manage their own decisions" ON "decisions";
DROP POLICY IF EXISTS "Authenticated users can create decisions" ON "decisions";

-- 1. Decisions Policies
-- View: Members of the same organization
CREATE POLICY "Users can view decisions of their organization"
ON "decisions" FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()::text
  )
);

-- Insert: Members of the same organization
DROP POLICY IF EXISTS "Users can create decisions for their organization" ON "decisions";
CREATE POLICY "Users can create decisions for their organization"
ON "decisions" FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()::text
  )
  AND owner_id = auth.uid()::text -- Enforce owner is self
);

-- Update: Owner can update their decisions
DROP POLICY IF EXISTS "Owners can update their decisions" ON "decisions";
CREATE POLICY "Owners can update their decisions"
ON "decisions" FOR UPDATE
USING (
  owner_id = auth.uid()::text
);

-- Delete: Owner can delete their decisions
DROP POLICY IF EXISTS "Owners can delete their decisions" ON "decisions";
CREATE POLICY "Owners can delete their decisions"
ON "decisions" FOR DELETE
USING (
  owner_id = auth.uid()::text
);

-- 2. Stakeholders Policies
-- View: Members of the same organization (via the decision's organization)
DROP POLICY IF EXISTS "Users can view stakeholders of their org decisions" ON "stakeholders";
CREATE POLICY "Users can view stakeholders of their org decisions"
ON "stakeholders" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM decisions d
    JOIN users u ON u.organization_id = d.organization_id
    WHERE d.id = stakeholders.decision_id
    AND u.id = auth.uid()::text
  )
);

-- Insert: Decision Owner only
DROP POLICY IF EXISTS "Decision owners can add stakeholders" ON "stakeholders";
CREATE POLICY "Decision owners can add stakeholders"
ON "stakeholders" FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM decisions d
    WHERE d.id = stakeholders.decision_id
    AND d.owner_id = auth.uid()::text
  )
);

-- Delete: Decision Owner only
DROP POLICY IF EXISTS "Decision owners can remove stakeholders" ON "stakeholders";
CREATE POLICY "Decision owners can remove stakeholders"
ON "stakeholders" FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM decisions d
    WHERE d.id = stakeholders.decision_id
    AND d.owner_id = auth.uid()::text
  )
);

-- 3. Documents Policies
-- View: Members of the same organization
DROP POLICY IF EXISTS "Users can view documents of their org decisions" ON "documents";
CREATE POLICY "Users can view documents of their org decisions"
ON "documents" FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()::text
  )
);

-- Insert: Decision Owner only
DROP POLICY IF EXISTS "Decision owners can add documents" ON "documents";
CREATE POLICY "Decision owners can add documents"
ON "documents" FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM decisions d
    WHERE d.id = documents.decision_id
    AND d.owner_id = auth.uid()::text
  )
  AND organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()::text)
  AND uploaded_by = auth.uid()::text
);

-- Delete: Decision Owner only
DROP POLICY IF EXISTS "Decision owners can delete documents" ON "documents";
CREATE POLICY "Decision owners can delete documents"
ON "documents" FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM decisions d
    WHERE d.id = documents.decision_id
    AND d.owner_id = auth.uid()::text
  )
);
