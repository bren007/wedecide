-- Migration: Fix Automatic User Creation Trigger and Cleanup Orphaned Test Users
-- Fixes Test 5: Orphaned Auth Users (signup integrity) in staging deploy validator

-- ============================================================
-- 1. Create or Replace handle_new_user() Trigger Function
-- ============================================================
-- Ensures any auth.users insertion (whether via signUp, admin API, or test suites)
-- automatically provisions a public.users profile and default organization if missing.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id TEXT;
  v_name TEXT;
BEGIN
  -- If user profile already exists in public.users, do nothing
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id::text) THEN
    RETURN NEW;
  END IF;

  -- Extract user display name from raw_user_meta_data or default to email prefix/User
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'User'
  );

  -- 1. Create a default organization for the user
  INSERT INTO public.organizations (
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
    v_name || '''s Organization',
    'org-' || NEW.id::text,
    'free',
    'active',
    5,
    10,
    NOW()
  )
  RETURNING id INTO v_org_id;

  -- 2. Create public.users profile
  INSERT INTO public.users (
    id,
    email,
    name,
    organization_id,
    updated_at
  )
  VALUES (
    NEW.id::text,
    NEW.email,
    v_name,
    v_org_id,
    NOW()
  );

  -- 3. Assign Admin role
  INSERT INTO public.user_roles (
    id,
    user_id,
    organization_id,
    role
  )
  VALUES (
    gen_random_uuid()::text,
    NEW.id::text,
    v_org_id,
    'admin'
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log warning without blocking auth.users insertion if exception occurs
  RAISE WARNING 'handle_new_user failed for user % (%): %', NEW.id, NEW.email, SQLERRM;
  RETURN NEW;
END;
$$;

-- Bind trigger to auth.users ON INSERT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. Cleanup Existing Orphaned Test Users & Backfill Real Orphans
-- ============================================================

-- Backfill public profile + org for non-test orphaned auth users if any exist
DO $$
DECLARE
  r RECORD;
  v_org_id TEXT;
  v_name TEXT;
BEGIN
  FOR r IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users u ON u.id::text = au.id::text
    WHERE u.id IS NULL AND au.email NOT LIKE '%@test.alturagov.com'
  LOOP
    v_name := COALESCE(
      r.raw_user_meta_data->>'name',
      r.raw_user_meta_data->>'full_name',
      split_part(r.email, '@', 1),
      'User'
    );

    INSERT INTO public.organizations (id, name, slug, subscription_tier, subscription_status, max_users, max_decisions, updated_at)
    VALUES (gen_random_uuid()::text, v_name || '''s Organization', 'org-' || r.id::text, 'free', 'active', 5, 10, NOW())
    RETURNING id INTO v_org_id;

    INSERT INTO public.users (id, email, name, organization_id, updated_at)
    VALUES (r.id::text, r.email, v_name, v_org_id, NOW());

    INSERT INTO public.user_roles (id, user_id, organization_id, role)
    VALUES (gen_random_uuid()::text, r.id::text, v_org_id, 'admin');
  END LOOP;
END;
$$;

-- Delete leftover orphaned test accounts (@test.alturagov.com) from auth.users that lack public profiles
DELETE FROM auth.users
WHERE email LIKE '%@test.alturagov.com'
  AND id::text NOT IN (SELECT id FROM public.users);
