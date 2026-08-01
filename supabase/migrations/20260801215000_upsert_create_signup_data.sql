-- Migration: Update create_signup_data RPC to use upserts and handle conflicts
-- Allows safe repeated calls without duplicate key errors

CREATE OR REPLACE FUNCTION create_signup_data(
  p_user_id TEXT,
  p_email TEXT,
  p_name TEXT,
  p_org_name TEXT,
  p_org_slug TEXT
) RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_org_id TEXT;
  v_result JSON;
BEGIN
  -- 1. Create or get Organization (slug is unique)
  INSERT INTO organizations (
    id,
    name,
    slug,
    subscription_tier,
    subscription_status,
    max_users,
    max_decisions,
    updated_at
  ) VALUES (
    gen_random_uuid()::text,
    p_org_name,
    p_org_slug,
    'free',
    'active',
    5,
    10,
    NOW()
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    subscription_tier = EXCLUDED.subscription_tier,
    subscription_status = EXCLUDED.subscription_status,
    max_users = EXCLUDED.max_users,
    max_decisions = EXCLUDED.max_decisions,
    updated_at = NOW()
  RETURNING id INTO v_org_id;

  -- 2. Create or update User profile
  INSERT INTO users (
    id,
    email,
    name,
    organization_id,
    updated_at
  ) VALUES (
    p_user_id,
    p_email,
    p_name,
    v_org_id,
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    organization_id = EXCLUDED.organization_id,
    updated_at = NOW();

  -- 3. Assign admin role (idempotent)
  INSERT INTO user_roles (
    id,
    user_id,
    organization_id,
    role
  ) VALUES (
    gen_random_uuid()::text,
    p_user_id,
    v_org_id,
    'admin'
  ) ON CONFLICT DO NOTHING;

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
