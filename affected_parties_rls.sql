-- RLS Policies for affected_parties
ALTER TABLE "affected_parties" ENABLE ROW LEVEL SECURITY;

-- 1. View: Members of the same organization (via the decision's organization)
DROP POLICY IF EXISTS "Users can view affected_parties of their org decisions" ON "affected_parties";
CREATE POLICY "Users can view affected_parties of their org decisions"
ON "affected_parties" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM decisions d
    JOIN users u ON u.organization_id = d.organization_id
    WHERE d.id = affected_parties.decision_id
    AND u.id = auth.uid()::text
  )
);

-- 2. Insert: Decision Owner only
DROP POLICY IF EXISTS "Decision owners can add affected_parties" ON "affected_parties";
CREATE POLICY "Decision owners can add affected_parties"
ON "affected_parties" FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM decisions d
    WHERE d.id = affected_parties.decision_id
    AND d.owner_id = auth.uid()::text
  )
);

-- 3. Delete: Decision Owner only
DROP POLICY IF EXISTS "Decision owners can remove affected_parties" ON "affected_parties";
CREATE POLICY "Decision owners can remove affected_parties"
ON "affected_parties" FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM decisions d
    WHERE d.id = affected_parties.decision_id
    AND d.owner_id = auth.uid()::text
  )
);
