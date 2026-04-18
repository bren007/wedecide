-- STAGING DEPLOYMENT SCRIPT
-- This script applies the fixes for the Signup Flow and RLS Policies to the Staging environment.
-- It works on top of the existing schema.

-- =========================================================================
-- PART 1: SECURE SIGNUP FUNCTION (Security Definer)
-- =========================================================================
-- This function allows new users to create their organization and profile
-- bypassing RLS permissions during the signup process.

CREATE OR REPLACE FUNCTION create_signup_data(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_org_name TEXT,
  p_org_slug TEXT
)
RETURNS JSON
SECURITY DEFINER -- Runs as admin to bypass RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_org_id UUID;
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
    gen_random_uuid(),
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
    p_user_id,
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
    gen_random_uuid(),
    p_user_id,
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

-- Grant execution to everyone
GRANT EXECUTE ON FUNCTION create_signup_data TO public, anon, authenticated;


-- =========================================================================
-- PART 2: RLS POLICIES (Read/Write Permissions)
-- =========================================================================
-- These policies ensure that once data is created, users can read it securely.
-- We reset policies first to ensure a clean slate.

-- 1. Disable RLS temporarily to avoid conflicts during reset
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting policies
DROP POLICY IF EXISTS "final_user_select" ON users;
DROP POLICY IF EXISTS "user_select_authenticated" ON users;
DROP POLICY IF EXISTS "users_select_own_profile" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

DROP POLICY IF EXISTS "final_org_select" ON organizations;
DROP POLICY IF EXISTS "orgs_read_own" ON organizations;

DROP POLICY IF EXISTS "final_role_select" ON user_roles;
DROP POLICY IF EXISTS "roles_read_own" ON user_roles;

-- 3. Re-enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create READ Policies (SELECT)
-- Allow user to read their OWN profile
CREATE POLICY "users_read_own"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id);

-- Allow user to read organizations they belong to
CREATE POLICY "orgs_read_own"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()::text
    )
  );

-- Allow user to read their own roles
CREATE POLICY "roles_read_own"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

-- 5. Create WRITE Policies (UPDATE)
-- Allow user to update their own profile
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- 6. Grant Schema Usage (Good practice)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

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
  organization_id::text = get_auth_org_id()::text
);

CREATE POLICY "Admins can manage meetings"
ON meetings FOR ALL
USING (
  organization_id::text = get_auth_org_id()::text
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
    WHERE m.id::text = agenda_items.meeting_id::text
    AND m.organization_id::text = get_auth_org_id()::text
  )
);

CREATE POLICY "Admins can manage agenda items"
ON agenda_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id::text = agenda_items.meeting_id::text
    AND m.organization_id::text = get_auth_org_id()::text
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
    WHERE m.id::text = meeting_attendees.meeting_id::text
    AND m.organization_id::text = get_auth_org_id()::text
  )
);

CREATE POLICY "Admins can manage meeting attendees"
ON meeting_attendees FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id::text = meeting_attendees.meeting_id::text
    AND m.organization_id::text = get_auth_org_id()::text
    AND EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid()::text 
      AND ur.role IN ('admin', 'chair')
    )
  )
);

-- Fix for "Function Search Path Mutable" warning
-- This ensures the function runs with a fixed search_path, preventing potential hijacking.

ALTER FUNCTION public.get_user_organization_id() SET search_path = public;