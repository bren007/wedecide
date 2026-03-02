-- Enable RLS for decision_feedback
ALTER TABLE decision_feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "users_select_decision_feedback" ON decision_feedback;
DROP POLICY IF EXISTS "users_insert_decision_feedback" ON decision_feedback;
DROP POLICY IF EXISTS "users_update_own_decision_feedback" ON decision_feedback;
DROP POLICY IF EXISTS "users_delete_own_decision_feedback" ON decision_feedback;

-- 1. SELECT: Users can view feedback if the related decision belongs to their organization
CREATE POLICY "users_select_decision_feedback"
  ON decision_feedback FOR SELECT
  TO authenticated
  USING (decision_id::uuid IN (
    SELECT id::uuid FROM decisions WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id::uuid = auth.uid()
    )
  ));

-- 2. INSERT: Users can add feedback if the related decision belongs to their organization
CREATE POLICY "users_insert_decision_feedback"
  ON decision_feedback FOR INSERT
  TO authenticated
  WITH CHECK (decision_id::uuid IN (
    SELECT id::uuid FROM decisions WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id::uuid = auth.uid()
    )
  ));

-- 3. UPDATE: Users can only update their own feedback
CREATE POLICY "users_update_own_decision_feedback"
  ON decision_feedback FOR UPDATE
  TO authenticated
  USING (user_id::uuid = auth.uid())
  WITH CHECK (user_id::uuid = auth.uid());

-- 4. DELETE: Users can delete their own feedback, or admins/chairs can delete feedback in their org
CREATE POLICY "users_delete_own_decision_feedback"
  ON decision_feedback FOR DELETE
  TO authenticated
  USING (
    user_id::uuid = auth.uid()
    OR decision_id::uuid IN (
      SELECT d.id::uuid FROM decisions d
      JOIN user_roles ur ON ur.organization_id = d.organization_id
      WHERE ur.user_id::uuid = auth.uid() AND ur.role IN ('admin', 'chair')
    )
  );

-- Reload PostgREST schema cache so Supabase API picks it up immediately
NOTIFY pgrst, 'reload schema';
