-- ============================================
-- FIX RLS 403 & Type Errors (Secure Version)
-- ============================================

-- 1. Create a robust SECURITY DEFINER function to get org ID
-- This bypasses RLS on the users table and handles type casting safely.
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id 
  FROM public.users 
  WHERE id = auth.uid()::text 
  LIMIT 1;
$$;

-- 2. Drop existing policies (Clean Slate)
DROP POLICY IF EXISTS "Users can view org meetings" ON meetings;
DROP POLICY IF EXISTS "Admins can manage meetings" ON meetings;
DROP POLICY IF EXISTS "Users can view agenda items" ON agenda_items;
DROP POLICY IF EXISTS "Admins can manage agenda items" ON agenda_items;
DROP POLICY IF EXISTS "Users can view meeting attendees" ON meeting_attendees;
DROP POLICY IF EXISTS "Admins can manage meeting attendees" ON meeting_attendees;

-- 3. Meetings Policies (Using function)
CREATE POLICY "Users can view org meetings"
ON meetings FOR SELECT
USING (
  organization_id = get_auth_org_id()
);

CREATE POLICY "Admins can manage meetings"
ON meetings FOR ALL
USING (
  organization_id = get_auth_org_id()
  AND EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid()::text 
    AND ur.role IN ('admin', 'chair')
  )
);

-- 4. Agenda Items Policies (Using function)
CREATE POLICY "Users can view agenda items"
ON agenda_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = agenda_items.meeting_id
    AND m.organization_id = get_auth_org_id()
  )
);

CREATE POLICY "Admins can manage agenda items"
ON agenda_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = agenda_items.meeting_id
    AND m.organization_id = get_auth_org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid()::text 
      AND ur.role IN ('admin', 'chair')
    )
  )
);

-- 5. Meeting Attendees Policies (Using function)
CREATE POLICY "Users can view meeting attendees"
ON meeting_attendees FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = meeting_attendees.meeting_id
    AND m.organization_id = get_auth_org_id()
  )
);

CREATE POLICY "Admins can manage meeting attendees"
ON meeting_attendees FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = meeting_attendees.meeting_id
    AND m.organization_id = get_auth_org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid()::text 
      AND ur.role IN ('admin', 'chair')
    )
  )
);
