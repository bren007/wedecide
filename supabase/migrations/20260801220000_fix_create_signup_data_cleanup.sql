-- Migration: Fix create_signup_data — restore temp-org cleanup after trigger
--
-- WHAT BROKE:
-- Migration 20260801215000 updated create_signup_data to accept p_user_id as TEXT
-- instead of UUID, and added ON CONFLICT upserts. However, it accidentally dropped
-- the temp-org cleanup block that migration 20260801213000 introduced.
--
-- HOW IT BREAKS:
-- The handle_new_user trigger fires on auth.signUp() and creates a temporary org
-- (slug: 'org-{user_uuid}') plus one admin user_role in that temp org.
-- When create_signup_data then runs, it moves the user to the real org and inserts
-- a second admin role there — but never deletes the trigger's stale role.
-- Result: user has 2 user_role rows; integration test asserts exactly 1 → FAIL.
--
-- FIX:
-- Re-apply the function with the cleanup block restored.

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
  v_org_id     TEXT;
  v_old_org_id TEXT;
  v_result     JSON;
BEGIN
  -- Capture the user's current org BEFORE we move them (may be a trigger-created temp org).
  SELECT organization_id INTO v_old_org_id FROM users WHERE id = p_user_id;

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

  -- 3. Assign admin role in the real org (idempotent)
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

  -- 4. Clean up the trigger-created temporary org (slug: 'org-{uuid}') if the user
  --    was moved to a different org. Without this, two user_role rows exist:
  --    one from the trigger's temp org, one from the real org.
  IF v_old_org_id IS NOT NULL AND v_old_org_id <> v_org_id THEN
    DELETE FROM user_roles WHERE organization_id = v_old_org_id AND user_id = p_user_id;
    DELETE FROM organizations WHERE id = v_old_org_id AND slug LIKE 'org-%';
  END IF;

  -- 5. Return success data
  SELECT json_build_object(
    'organization_id', v_org_id,
    'success', true
  ) INTO v_result;
  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- No GRANT needed: permissions on the TEXT signature were already granted in 215000.
