-- Fix RLS policies to use explicit UUID casting for consistency matches

-- ==========================================
-- 1. Helper Functions (Safe UUID Comparisons)
-- ==========================================

-- Function to check if user is admin of an org
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id::uuid = auth.uid() 
    AND organization_id::uuid = org_id::uuid 
    AND role IN ('admin', 'chair')
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.is_org_admin TO authenticated;

-- Function to get user's org ID (Safe UUID comparison)
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id 
  FROM public.users 
  WHERE id::uuid = auth.uid() 
  LIMIT 1;
$$;

-- ==========================================
-- 2. Organizations Policies
-- ==========================================
DROP POLICY IF EXISTS "admins_update_org" ON organizations;
CREATE POLICY "admins_update_org" ON organizations FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM user_roles 
        WHERE user_roles.user_id::uuid = auth.uid() 
        AND user_roles.organization_id::uuid = organizations.id::uuid 
        AND user_roles.role IN ('admin', 'chair')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM user_roles 
        WHERE user_roles.user_id::uuid = auth.uid() 
        AND user_roles.organization_id::uuid = organizations.id::uuid 
        AND user_roles.role IN ('admin', 'chair')
    )
);

-- ==========================================
-- 3. Meeting Groups Policies
-- ==========================================
ALTER TABLE meeting_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage meeting groups" ON meeting_groups;
CREATE POLICY "Admins can manage meeting groups" 
ON meeting_groups FOR ALL 
USING (
    EXISTS (
        SELECT 1 
        FROM user_roles ur 
        WHERE ur.user_id::uuid = auth.uid() 
        AND ur.organization_id::uuid = meeting_groups.organization_id::uuid
        AND ur.role IN ('admin', 'chair')
    )
);
-- Remove debug policy
DROP POLICY IF EXISTS "debug_allow_meeting_groups" ON meeting_groups;


-- ==========================================
-- 4. User Roles Policies
-- ==========================================
DROP POLICY IF EXISTS "select_own_roles" ON user_roles;
CREATE POLICY "select_own_roles" ON user_roles FOR SELECT TO authenticated
USING (user_id::uuid = auth.uid());

DROP POLICY IF EXISTS "admins_select_org_roles" ON user_roles;
CREATE POLICY "admins_select_org_roles" ON user_roles FOR SELECT TO authenticated
USING (public.is_org_admin(organization_id::text));

DROP POLICY IF EXISTS "admins_update_org_roles" ON user_roles;
CREATE POLICY "admins_update_org_roles" ON user_roles FOR UPDATE TO authenticated
USING (public.is_org_admin(organization_id::text))
WITH CHECK (public.is_org_admin(organization_id::text));

DROP POLICY IF EXISTS "admins_delete_org_roles" ON user_roles;
CREATE POLICY "admins_delete_org_roles" ON user_roles FOR DELETE TO authenticated
USING (public.is_org_admin(organization_id::text));

-- Drop debug policy if it exists
DROP POLICY IF EXISTS "debug_allow_all_roles" ON user_roles;

-- ==========================================
-- 5. Meetings Policies
-- ==========================================
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org meetings" ON meetings;
CREATE POLICY "Users can view org meetings"
ON meetings FOR SELECT
USING (
  organization_id::uuid = (get_auth_org_id())::uuid
);

DROP POLICY IF EXISTS "Admins can manage meetings" ON meetings;
CREATE POLICY "Admins can manage meetings"
ON meetings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id::uuid = auth.uid() 
    AND ur.organization_id::uuid = meetings.organization_id::uuid
    AND ur.role IN ('admin', 'chair')
  )
);
-- Remove debug policy
DROP POLICY IF EXISTS "debug_allow_meetings" ON meetings;



-- ==========================================
-- 6. Agenda Items Policies
-- ==========================================
DROP POLICY IF EXISTS "Users can view agenda items" ON agenda_items;
CREATE POLICY "Users can view agenda items"
ON agenda_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id::uuid = agenda_items.meeting_id::uuid
    AND m.organization_id::uuid = (get_auth_org_id())::uuid
  )
);

DROP POLICY IF EXISTS "Admins can manage agenda items" ON agenda_items;
CREATE POLICY "Admins can manage agenda items"
ON agenda_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id::uuid = agenda_items.meeting_id::uuid
    AND EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id::uuid = auth.uid() 
      AND ur.organization_id::uuid = m.organization_id::uuid
      AND ur.role IN ('admin', 'chair')
    )
  )
);

-- ==========================================
-- 7. Meeting Attendees Policies
-- ==========================================
DROP POLICY IF EXISTS "Users can view meeting attendees" ON meeting_attendees;
CREATE POLICY "Users can view meeting attendees"
ON meeting_attendees FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id::uuid = meeting_attendees.meeting_id::uuid
    AND m.organization_id::uuid = (get_auth_org_id())::uuid
  )
);

DROP POLICY IF EXISTS "Admins can manage meeting attendees" ON meeting_attendees;
CREATE POLICY "Admins can manage meeting attendees"
ON meeting_attendees FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id::uuid = meeting_attendees.meeting_id::uuid
    AND EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id::uuid = auth.uid() 
      AND ur.organization_id::uuid = m.organization_id::uuid
      AND ur.role IN ('admin', 'chair')
    )
  )
);
