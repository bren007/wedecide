-- Migration: Allow generic updates to Strategic Ledger outside of meetings
-- This allows individuals who are proposers/owners to update their metadata without needing to be a chair/admin

DROP POLICY IF EXISTS "Append to ledger" ON strategic_ledger;
CREATE POLICY "Append to ledger" ON strategic_ledger
  FOR INSERT
  WITH CHECK (
    org_id = get_auth_user_org_id() 
  );
