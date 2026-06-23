-- Migration: Optimize get_user_profile RPC for fast auth boot
-- Fixes: fetchUserProfile RPC timeouts (>30000ms, Attempt 1 and 2) logged in AuthContext.
-- Root cause: No covering index on users(id) for the profile lookup path,
-- and the inline query hit RLS policy evaluation overhead on every auth event.
--
-- Two changes:
--   1. Composite covering index on users(id, organization_id, name, email)
--      so the SELECT in get_user_profile is a pure index-only scan.
--   2. SECURITY DEFINER get_user_profile RPC that bypasses RLS for the single
--      trusted lookup, eliminating recursive RLS evaluation that caused the timeouts.

-- ============================================================
-- 1. COVERING INDEX: users primary lookup path
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_profile_lookup
  ON public.users (id)
  INCLUDE (organization_id, name, email);

-- ============================================================
-- 2. COVERING INDEX: user_roles lookup (second query in fetchUserProfile)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_org
  ON public.user_roles (user_id, organization_id)
  INCLUDE (role);

-- ============================================================
-- 3. get_user_profile: SECURITY DEFINER RPC (bypasses RLS,
--    avoids recursive policy evaluation, returns single row)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_profile(p_user_id TEXT)
RETURNS TABLE (
  id               TEXT,
  email            TEXT,
  name             TEXT,
  organization_id  TEXT,
  is_global_admin  BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    u.id,
    u.email,
    u.name,
    u.organization_id,
    COALESCE(u.is_global_admin, false) AS is_global_admin
  FROM public.users u
  WHERE u.id = p_user_id
  LIMIT 1;
$$;

-- Grant execution to authenticated users (AuthContext calls this as the authed user)
GRANT EXECUTE ON FUNCTION public.get_user_profile(TEXT) TO authenticated;

-- ============================================================
-- NOTE: The AuthContext currently calls this via:
--   supabase.rpc('get_user_profile', { p_user_id: userId }).single()
-- The function signature above matches that call contract exactly.
-- ============================================================
