-- WeDecide Baseline Schema
-- Standardized on TEXT IDs to match existing Dev state

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subscription_tier TEXT DEFAULT 'free' NOT NULL,
  subscription_status TEXT DEFAULT 'active' NOT NULL,
  max_users INTEGER DEFAULT 5 NOT NULL,
  max_decisions INTEGER DEFAULT 10 NOT NULL,
  license_tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. User Roles
CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  role TEXT NOT NULL, -- chair, admin, member, secretary
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, organization_id, role)
);

-- 4. Decisions
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' NOT NULL, -- draft, active, completed
  owner_id TEXT NOT NULL REFERENCES users(id),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  decision_type TEXT,
  reversibility_type TEXT,
  agenda_item_id UUID, -- Will be linked later after agenda_items created
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Stakeholders
CREATE TABLE IF NOT EXISTS stakeholders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  decision_id TEXT NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Documents
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  decision_id TEXT NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- google_docs, google_sheets, pdf, etc.
  url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  description TEXT,
  is_part_of_meeting_pack BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Meeting Groups
CREATE TABLE IF NOT EXISTS meeting_groups (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Meetings
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location TEXT,
  status TEXT DEFAULT 'scheduled' NOT NULL,
  snapshot_start JSONB,
  snapshot_end JSONB,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Agenda Items
CREATE TABLE IF NOT EXISTS agenda_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  order_index INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Now add the FK back to decisions if it didn't exist
ALTER TABLE decisions DROP COLUMN IF EXISTS agenda_item_id CASCADE;
ALTER TABLE decisions ADD COLUMN agenda_item_id TEXT REFERENCES agenda_items(id) ON DELETE SET NULL;

-- 10. Meeting Attendees
CREATE TABLE IF NOT EXISTS meeting_attendees (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'invited' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(meeting_id, user_id)
);

-- 11. Decision Feedback
CREATE TABLE IF NOT EXISTS decision_feedback (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  decision_id TEXT NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. Decision RAPID Roles
CREATE TABLE IF NOT EXISTS decision_rapid_roles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  decision_id TEXT NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL, -- recommend, agree, perform, input, decide
  user_id TEXT REFERENCES users(id),
  external_name TEXT,
  external_role TEXT,
  meeting_group_id TEXT REFERENCES meeting_groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Helper Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql'
SECURITY DEFINER;

-- Robust SECURITY DEFINER function to get org ID (Alternative name used in some policies)
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
  v_uid text;
  v_org_id text;
BEGIN
  v_uid := current_setting('request.jwt.claims', true)::jsonb ->> 'sub';
  IF v_uid IS NULL THEN RETURN NULL; END IF;
  
  SELECT organization_id INTO v_org_id
  FROM public.users 
  WHERE id = v_uid
  LIMIT 1;
  RETURN v_org_id;
END;
$$;

-- Robust SECURITY DEFINER function to get org ID (SAFE version)
CREATE OR REPLACE FUNCTION public.get_auth_user_org_id_safe()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
  v_uid text;
  v_org_id text;
BEGIN
  v_uid := current_setting('request.jwt.claims', true)::jsonb ->> 'sub';
  IF v_uid IS NULL THEN RETURN NULL; END IF;

  SELECT organization_id INTO v_org_id
  FROM public.users 
  WHERE id = v_uid
  LIMIT 1;
  RETURN v_org_id;
END;
$$;

-- Secure signup function
CREATE OR REPLACE FUNCTION create_signup_data(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_org_name TEXT,
  p_org_slug TEXT
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_org_id TEXT;
  v_result JSON;
BEGIN
  -- 1. Create Organization
  INSERT INTO organizations (
    id,
    name, 
    slug, 
    subscription_tier, 
    subscription_status, 
    max_users, 
    max_decisions,
    updated_at
  )
  VALUES (
    gen_random_uuid()::text,
    p_org_name,
    p_org_slug,
    'free',
    'active',
    5,
    10,
    NOW()
  )
  RETURNING id INTO v_org_id;

  -- 2. Create User Profile
  INSERT INTO users (
    id,
    email,
    name,
    organization_id,
    updated_at
  )
  VALUES (
    p_user_id::text,
    p_email,
    p_name,
    v_org_id,
    NOW()
  );

  -- 3. Assign Admin Role
  INSERT INTO user_roles (
    id,
    user_id,
    organization_id,
    role
  )
  VALUES (
    gen_random_uuid()::text,
    p_user_id::text,
    v_org_id,
    'admin'
  );

  -- 4. Return success data
  SELECT json_build_object(
    'organization_id', v_org_id,
    'success', true
  ) INTO v_result;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION create_signup_data TO public, anon, authenticated;

-- Triggers
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_decisions_updated_at ON decisions;
CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_groups_updated_at ON meeting_groups;
CREATE TRIGGER update_meeting_groups_updated_at BEFORE UPDATE ON meeting_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agenda_items_updated_at ON agenda_items;
CREATE TRIGGER update_agenda_items_updated_at BEFORE UPDATE ON agenda_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_attendees_updated_at ON meeting_attendees;
CREATE TRIGGER update_meeting_attendees_updated_at BEFORE UPDATE ON meeting_attendees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
