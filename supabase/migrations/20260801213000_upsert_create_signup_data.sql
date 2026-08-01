-- Migration: Update create_signup_data RPC for ON CONFLICT support
-- Allows create_signup_data to safely update existing user profiles if auto-created by auth trigger

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
  v_old_org_id TEXT;
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

  -- Check if user profile was already auto-created by auth trigger
  SELECT organization_id INTO v_old_org_id FROM users WHERE id = p_user_id::text;

  -- 2. Upsert User Profile
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
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    organization_id = EXCLUDED.organization_id,
    updated_at = NOW();

  -- 3. Upsert Admin Role for new org
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
  )
  ON CONFLICT (user_id, organization_id, role) DO NOTHING;

  -- Clean up temporary org created by trigger if it was different and empty
  IF v_old_org_id IS NOT NULL AND v_old_org_id <> v_org_id THEN
    DELETE FROM user_roles WHERE organization_id = v_old_org_id AND user_id = p_user_id::text;
    DELETE FROM organizations WHERE id = v_old_org_id AND slug LIKE 'org-%';
  END IF;

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
