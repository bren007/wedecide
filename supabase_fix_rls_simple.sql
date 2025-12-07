-- SIMPLIFIED RLS FIX
-- Run this to reset the users table policies to the absolute basics
-- This should resolve the 406 Error during signup

-- 1. Reset permissions
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO service_role;

-- 2. Drop all existing policies on users to clear conflicts
DROP POLICY IF EXISTS "Users can view org members" ON public.users;
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Users can see their own profile" ON public.users;

-- 3. Create the simplest possible "Self View" policy
CREATE POLICY "Users can see their own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- 4. Create update policy
CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- 5. Create organization view policy (non-recursive)
-- This allows users to see OTHER users in their organization
CREATE POLICY "Users can see organization members" 
ON public.users 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  )
);
