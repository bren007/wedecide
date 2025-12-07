-- COMPLETE RLS RESET & FIX (Updated)
-- This script wipes all existing policies for key tables and recreates them correctly.
-- It works for BOTH the '406 Not Acceptable' and '500 Infinite Recursion' errors.
-- Now includes comprehensive DROP statements to prevent "already exists" errors.

-- 1. DISABLE RLS TEMPORARILY
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 2. DROP ALL POSSIBLE POLICIES (Clean Slate)
-- Users Table
DROP POLICY IF EXISTS "Users can view org members" ON public.users;
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
DROP POLICY IF EXISTS "Users can see their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can see organization members" ON public.users;
DROP POLICY IF EXISTS "Users can see org members" ON public.users; -- Dropping the one we create too
DROP POLICY IF EXISTS "Debug: Allow Read All" ON public.users;

-- Organizations Table
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can see their own org" ON public.organizations; -- Dropping the one we create too

-- User Roles Table
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can see their own roles" ON public.user_roles; -- Dropping the one we create too


-- 3. CREATE SAFE LOOKUP FUNCTION (Breaks Recursion)
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_my_org_id TO authenticated;

-- 4. RE-ENABLE RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. CREATE NEW, CLEAN POLICIES

-- USERS TABLE
CREATE POLICY "Users can see their own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can see org members" 
ON public.users FOR SELECT 
USING (organization_id = get_my_org_id());

-- ORGANIZATIONS TABLE
CREATE POLICY "Users can see their own org" 
ON public.organizations FOR SELECT 
USING (id = get_my_org_id());

-- USER ROLES TABLE
CREATE POLICY "Users can see their own roles" 
ON public.user_roles FOR SELECT 
USING (user_id = auth.uid());
