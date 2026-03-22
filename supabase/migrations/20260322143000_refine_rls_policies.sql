-- Final Core RLS Policies for Parity
-- Explicitly enabling RLS and defining robust policies with WITH CHECK
-- FIXED: Removed FORCE ROW LEVEL SECURITY to allow SECURITY DEFINER functions to work correctly.

-- Ensure RLS is enabled on all tables
DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '_%') LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE public.%I NO FORCE ROW LEVEL SECURITY;', t);
  END LOOP;
END $$;

-- 1. Organizations
DROP POLICY IF EXISTS "orgs_read_own" ON organizations;
CREATE POLICY "orgs_read_own" ON organizations FOR SELECT TO authenticated
  USING (id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()::text));

DROP POLICY IF EXISTS "select_own_org" ON organizations;
CREATE POLICY "select_own_org" ON organizations FOR SELECT TO authenticated
  USING (id = get_auth_org_id());

DROP POLICY IF EXISTS "signup_insert_org" ON organizations;
CREATE POLICY "signup_insert_org" ON organizations FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "admins_update_org" ON organizations;
CREATE POLICY "admins_update_org" ON organizations FOR UPDATE TO authenticated
  USING (id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair')))
  WITH CHECK (id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair')));

-- 2. Users
DROP POLICY IF EXISTS "users_read_own" ON users;
CREATE POLICY "users_read_own" ON users FOR SELECT TO authenticated
  USING (id = auth.uid()::text OR organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own" ON users FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid()::text);

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- 3. User Roles
DROP POLICY IF EXISTS "roles_read_own" ON user_roles;
CREATE POLICY "roles_read_own" ON user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text OR organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "admins_update_org_roles" ON user_roles;
CREATE POLICY "admins_update_org_roles" ON user_roles FOR UPDATE TO authenticated
  USING (organization_id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair')))
  WITH CHECK (organization_id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair')));

DROP POLICY IF EXISTS "admins_delete_org_roles" ON user_roles;
CREATE POLICY "admins_delete_org_roles" ON user_roles FOR DELETE TO authenticated
  USING (organization_id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair')));

-- 4. Meetings
DROP POLICY IF EXISTS "Users can view org meetings" ON meetings;
CREATE POLICY "Users can view org meetings" ON meetings FOR SELECT TO authenticated
  USING (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "Admins can insert meetings" ON meetings;
CREATE POLICY "Admins can insert meetings" ON meetings FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair')));

DROP POLICY IF EXISTS "Admins can update meetings" ON meetings;
CREATE POLICY "Admins can update meetings" ON meetings FOR UPDATE TO authenticated
  USING (organization_id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair')))
  WITH CHECK (organization_id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair')));

DROP POLICY IF EXISTS "Admins can delete meetings" ON meetings;
CREATE POLICY "Admins can delete meetings" ON meetings FOR DELETE TO authenticated
  USING (organization_id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair')));

-- 5. Agenda Items
DROP POLICY IF EXISTS "Users can view agenda items" ON agenda_items;
CREATE POLICY "Users can view agenda items" ON agenda_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM meetings m WHERE m.id = meeting_id AND m.organization_id = get_auth_org_id()));

DROP POLICY IF EXISTS "Admins can insert agenda items" ON agenda_items;
CREATE POLICY "Admins can insert agenda items" ON agenda_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM meetings m WHERE m.id = meeting_id AND m.organization_id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair'))));

DROP POLICY IF EXISTS "Admins can update agenda items" ON agenda_items;
CREATE POLICY "Admins can update agenda items" ON agenda_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM meetings m WHERE m.id = meeting_id AND m.organization_id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair'))))
  WITH CHECK (EXISTS (SELECT 1 FROM meetings m WHERE m.id = meeting_id AND m.organization_id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair'))));

DROP POLICY IF EXISTS "Admins can delete agenda items" ON agenda_items;
CREATE POLICY "Admins can delete agenda items" ON agenda_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM meetings m WHERE m.id = meeting_id AND m.organization_id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair'))));

-- 6. Meeting Groups
DROP POLICY IF EXISTS "Users can view org meeting groups" ON meeting_groups;
CREATE POLICY "Users can view org meeting groups" ON meeting_groups FOR SELECT TO authenticated
  USING (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "Admins can insert meeting groups" ON meeting_groups;
CREATE POLICY "Admins can insert meeting groups" ON meeting_groups FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair')));

DROP POLICY IF EXISTS "Admins can update meeting groups" ON meeting_groups;
CREATE POLICY "Admins can update meeting groups" ON meeting_groups FOR UPDATE TO authenticated
  USING (organization_id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair')))
  WITH CHECK (organization_id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair')));

DROP POLICY IF EXISTS "Admins can delete meeting groups" ON meeting_groups;
CREATE POLICY "Admins can delete meeting groups" ON meeting_groups FOR DELETE TO authenticated
  USING (organization_id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair')));

-- 7. Decisions
DROP POLICY IF EXISTS "Users can view decisions of their organization" ON decisions;
CREATE POLICY "Users can view decisions of their organization" ON decisions FOR SELECT TO authenticated
  USING (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "Users can create decisions for their organization" ON decisions;
CREATE POLICY "Users can create decisions for their organization" ON decisions FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_auth_org_id() AND owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Owners can update their decisions" ON decisions;
CREATE POLICY "Owners can update their decisions" ON decisions FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()::text)
  WITH CHECK (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Owners can delete their decisions" ON decisions;
CREATE POLICY "Owners can delete their decisions" ON decisions FOR DELETE TO authenticated
  USING (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Chairs can update decisions in their organization" ON decisions;
CREATE POLICY "Chairs can update decisions in their organization" ON decisions FOR UPDATE TO authenticated
  USING (organization_id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('chair', 'admin')))
  WITH CHECK (organization_id = get_auth_org_id() AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('chair', 'admin')));

-- 8. Decision Feedback
DROP POLICY IF EXISTS "users_select_decision_feedback" ON decision_feedback;
CREATE POLICY "users_select_decision_feedback" ON decision_feedback FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM decisions d WHERE d.id = decision_id AND d.organization_id = get_auth_org_id()));

DROP POLICY IF EXISTS "users_insert_decision_feedback" ON decision_feedback;
CREATE POLICY "users_insert_decision_feedback" ON decision_feedback FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "users_update_own_decision_feedback" ON decision_feedback;
CREATE POLICY "users_update_own_decision_feedback" ON decision_feedback FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "users_delete_own_decision_feedback" ON decision_feedback;
CREATE POLICY "users_delete_own_decision_feedback" ON decision_feedback FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- 9. Decision RAPID Roles
DROP POLICY IF EXISTS "Users can view decision RAPID roles" ON decision_rapid_roles;
CREATE POLICY "Users can view decision RAPID roles" ON decision_rapid_roles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM decisions d WHERE d.id = decision_id AND d.organization_id = get_auth_org_id()));

DROP POLICY IF EXISTS "Decision owners and admins can manage RAPID roles" ON decision_rapid_roles;
CREATE POLICY "Decision owners and admins can manage RAPID roles" ON decision_rapid_roles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM decisions d WHERE d.id = decision_id AND (d.owner_id = auth.uid()::text OR d.organization_id = get_auth_org_id())) AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair')))
  WITH CHECK (EXISTS (SELECT 1 FROM decisions d WHERE d.id = decision_id AND (d.owner_id = auth.uid()::text OR d.organization_id = get_auth_org_id())) AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair')));
