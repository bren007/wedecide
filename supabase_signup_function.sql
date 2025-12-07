-- Secure Signup Function
-- This function runs with SECURITY DEFINER privileges (admin) to bypass RLS
-- It handles the creation of Organization, User Profile, and User Role transactionally

CREATE OR REPLACE FUNCTION create_signup_data(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_org_name TEXT,
  p_org_slug TEXT
)
RETURNS JSON
SECURITY DEFINER -- This is the magic part: runs as admin!
SET search_path = public -- Secure search path
LANGUAGE plpgsql
AS $$
DECLARE
  v_org_id UUID;
  v_result JSON;
BEGIN
  -- 1. Create Organization
  INSERT INTO organizations (
    name, 
    slug, 
    subscription_tier, 
    subscription_status, 
    max_users, 
    max_decisions
  )
  VALUES (
    p_org_name,
    p_org_slug,
    'free',
    'active',
    5,
    10
  )
  RETURNING id INTO v_org_id;

  -- 2. Create User Profile
  INSERT INTO users (
    id,
    email,
    name,
    organization_id
  )
  VALUES (
    p_user_id,
    p_email,
    p_name,
    v_org_id
  );

  -- 3. Assign Admin Role
  INSERT INTO user_roles (
    user_id,
    organization_id,
    role
  )
  VALUES (
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
  -- Should roll back transaction automatically on error
  RAISE;
END;
$$;

-- Grant execute permission to everyone (authenticated and anon)
GRANT EXECUTE ON FUNCTION create_signup_data TO public, anon, authenticated;
