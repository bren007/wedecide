-- Migration to align staging policies with dev

-- Drop extra policies found on Staging
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'affected_parties') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Decision owners can add affected_parties', 'affected_parties');
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'affected_parties') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Decision owners can remove affected_parties', 'affected_parties');
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'affected_parties') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Users can view affected_parties of their org decisions', 'affected_parties');
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'decisions') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'manage_org_decisions', 'decisions');
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'documents') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'manage_documents', 'documents');
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'invitations') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Admins can create invitations', 'invitations');
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'invitations') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Admins can delete invitations', 'invitations');
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'invitations') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Admins can view invitations', 'invitations');
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'organizations') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Users can see their own org', 'organizations');
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'stakeholders') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'manage_stakeholders', 'stakeholders');
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_roles') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Users can see their own roles', 'user_roles');
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_roles') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'admins_select_org_roles', 'user_roles');
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_roles') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'select_own_roles', 'user_roles');
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_roles') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'signup_insert_role', 'user_roles');
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'users') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Users can update their own profile', 'users');
  END IF;
END $$;


-- Create missing policies found on Dev
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'audit_records') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Admins can manage audit_records', 'audit_records');
    EXECUTE 'CREATE POLICY "Admins can manage audit_records" ON "audit_records" FOR ALL   USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (auth.uid())::text) AND (ur.role = ANY (ARRAY[''admin''::text, ''chair''::text]))))))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'decision_feedback') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Chairs can create feedback', 'decision_feedback');
    EXECUTE 'CREATE POLICY "Chairs can create feedback" ON "decision_feedback" FOR INSERT   WITH CHECK (((EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN decisions d ON ((d.organization_id = ur.organization_id)))
  WHERE ((d.id = decision_feedback.decision_id) AND (ur.user_id = (auth.uid())::text) AND (ur.role = ANY (ARRAY[''chair''::text, ''admin''::text]))))) AND (user_id = (auth.uid())::text)))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'decision_feedback') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Users can view feedback for their org decisions', 'decision_feedback');
    EXECUTE 'CREATE POLICY "Users can view feedback for their org decisions" ON "decision_feedback" FOR SELECT   USING ((EXISTS ( SELECT 1
   FROM (decisions d
     JOIN users u ON ((u.organization_id = d.organization_id)))
  WHERE ((d.id = decision_feedback.decision_id) AND (u.id = (auth.uid())::text)))))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'decisions') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Chairs can update decisions in their organization', 'decisions');
    EXECUTE 'CREATE POLICY "Chairs can update decisions in their organization" ON "decisions" FOR UPDATE   USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (auth.uid())::text) AND (user_roles.organization_id = decisions.organization_id) AND (user_roles.role = ''chair''::text)))))  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (auth.uid())::text) AND (user_roles.organization_id = decisions.organization_id) AND (user_roles.role = ''chair''::text)))))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'decisions') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Owners can delete their decisions', 'decisions');
    EXECUTE 'CREATE POLICY "Owners can delete their decisions" ON "decisions" FOR DELETE   USING ((owner_id = (auth.uid())::text))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'decisions') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Owners can update their decisions', 'decisions');
    EXECUTE 'CREATE POLICY "Owners can update their decisions" ON "decisions" FOR UPDATE   USING ((owner_id = (auth.uid())::text))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'decisions') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Users can create decisions for their organization', 'decisions');
    EXECUTE 'CREATE POLICY "Users can create decisions for their organization" ON "decisions" FOR INSERT   WITH CHECK (((organization_id IN ( SELECT users.organization_id
   FROM users
  WHERE (users.id = (auth.uid())::text))) AND (owner_id = (auth.uid())::text)))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'decisions') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Users can view decisions of their organization', 'decisions');
    EXECUTE 'CREATE POLICY "Users can view decisions of their organization" ON "decisions" FOR SELECT   USING ((organization_id IN ( SELECT users.organization_id
   FROM users
  WHERE (users.id = (auth.uid())::text))))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'documents') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Decision owners can add documents', 'documents');
    EXECUTE 'CREATE POLICY "Decision owners can add documents" ON "documents" FOR INSERT   WITH CHECK (((EXISTS ( SELECT 1
   FROM decisions d
  WHERE ((d.id = documents.decision_id) AND (d.owner_id = (auth.uid())::text)))) AND (organization_id IN ( SELECT users.organization_id
   FROM users
  WHERE (users.id = (auth.uid())::text))) AND (uploaded_by = (auth.uid())::text)))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'documents') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Decision owners can delete documents', 'documents');
    EXECUTE 'CREATE POLICY "Decision owners can delete documents" ON "documents" FOR DELETE   USING ((EXISTS ( SELECT 1
   FROM decisions d
  WHERE ((d.id = documents.decision_id) AND (d.owner_id = (auth.uid())::text)))))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'documents') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Users can create documents in their organization', 'documents');
    EXECUTE 'CREATE POLICY "Users can create documents in their organization" ON "documents" FOR INSERT   WITH CHECK ((organization_id IN ( SELECT users.organization_id
   FROM users
  WHERE (users.id = (auth.uid())::text))))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'documents') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Users can view documents in their organization', 'documents');
    EXECUTE 'CREATE POLICY "Users can view documents in their organization" ON "documents" FOR SELECT   USING ((organization_id IN ( SELECT users.organization_id
   FROM users
  WHERE (users.id = (auth.uid())::text))))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'documents') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Users can view documents of their org decisions', 'documents');
    EXECUTE 'CREATE POLICY "Users can view documents of their org decisions" ON "documents" FOR SELECT   USING ((organization_id IN ( SELECT users.organization_id
   FROM users
  WHERE (users.id = (auth.uid())::text))))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'license_transactions') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Admins can manage license_transactions', 'license_transactions');
    EXECUTE 'CREATE POLICY "Admins can manage license_transactions" ON "license_transactions" FOR ALL   USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (auth.uid())::text) AND (ur.role = ANY (ARRAY[''admin''::text, ''chair''::text]))))))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'meeting_attendees') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Admins can manage meeting attendees', 'meeting_attendees');
    EXECUTE 'CREATE POLICY "Admins can manage meeting attendees" ON "meeting_attendees" FOR ALL   USING ((EXISTS ( SELECT 1
   FROM meetings m
  WHERE ((m.id = meeting_attendees.meeting_id) AND (m.organization_id = get_auth_org_id()) AND (EXISTS ( SELECT 1
           FROM user_roles ur
          WHERE ((ur.user_id = (auth.uid())::text) AND (ur.role = ANY (ARRAY[''admin''::text, ''chair''::text])))))))))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'meeting_attendees') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Users can view meeting attendees', 'meeting_attendees');
    EXECUTE 'CREATE POLICY "Users can view meeting attendees" ON "meeting_attendees" FOR SELECT   USING ((EXISTS ( SELECT 1
   FROM meetings m
  WHERE ((m.id = meeting_attendees.meeting_id) AND (m.organization_id = get_auth_org_id())))))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'organizations') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Users can view their own organization', 'organizations');
    EXECUTE 'CREATE POLICY "Users can view their own organization" ON "organizations" FOR SELECT   USING (((id IN ( SELECT user_roles.organization_id
   FROM user_roles
  WHERE (user_roles.user_id = (auth.uid())::text))) OR (id IN ( SELECT users.organization_id
   FROM users
  WHERE (users.id = (auth.uid())::text)))))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'organizations') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'admins_update_org', 'organizations');
    EXECUTE 'CREATE POLICY "admins_update_org" ON "organizations" FOR UPDATE   USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE (((user_roles.user_id)::uuid = auth.uid()) AND ((user_roles.organization_id)::uuid = (organizations.id)::uuid) AND (user_roles.role = ANY (ARRAY[''admin''::text, ''chair''::text]))))))  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE (((user_roles.user_id)::uuid = auth.uid()) AND ((user_roles.organization_id)::uuid = (organizations.id)::uuid) AND (user_roles.role = ANY (ARRAY[''admin''::text, ''chair''::text]))))))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'stakeholders') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Decision owners can add stakeholders', 'stakeholders');
    EXECUTE 'CREATE POLICY "Decision owners can add stakeholders" ON "stakeholders" FOR INSERT   WITH CHECK ((EXISTS ( SELECT 1
   FROM decisions d
  WHERE ((d.id = stakeholders.decision_id) AND (d.owner_id = (auth.uid())::text)))))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'stakeholders') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Decision owners can remove stakeholders', 'stakeholders');
    EXECUTE 'CREATE POLICY "Decision owners can remove stakeholders" ON "stakeholders" FOR DELETE   USING ((EXISTS ( SELECT 1
   FROM decisions d
  WHERE ((d.id = stakeholders.decision_id) AND (d.owner_id = (auth.uid())::text)))))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'stakeholders') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Users can view stakeholders of their org decisions', 'stakeholders');
    EXECUTE 'CREATE POLICY "Users can view stakeholders of their org decisions" ON "stakeholders" FOR SELECT   USING ((EXISTS ( SELECT 1
   FROM (decisions d
     JOIN users u ON ((u.organization_id = d.organization_id)))
  WHERE ((d.id = stakeholders.decision_id) AND (u.id = (auth.uid())::text)))))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_roles') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'roles_read_org', 'user_roles');
    EXECUTE 'CREATE POLICY "roles_read_org" ON "user_roles" FOR SELECT   USING ((organization_id = get_auth_user_org_id_safe()))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'users') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Users can insert their own user record', 'users');
    EXECUTE 'CREATE POLICY "Users can insert their own user record" ON "users" FOR INSERT   WITH CHECK (((auth.uid())::text = id))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'users') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Users can update their own user record', 'users');
    EXECUTE 'CREATE POLICY "Users can update their own user record" ON "users" FOR UPDATE   USING (((auth.uid())::text = id))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'users') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'users_read_org', 'users');
    EXECUTE 'CREATE POLICY "users_read_org" ON "users" FOR SELECT   USING ((organization_id = get_auth_user_org_id_safe()))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'users') THEN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'users_update_own', 'users');
    EXECUTE 'CREATE POLICY "users_update_own" ON "users" FOR UPDATE   USING (((auth.uid())::text = id))  WITH CHECK (((auth.uid())::text = id))';
  END IF;
END $$;

