-- DEBUG ACCESS SCRIPT
-- Run this to temporarily open up access to the users table.
-- This helps us determine if the issue is a specific RLS policy logic or general permissions.

-- 1. Explicitly Grant Permissions (in case they were missing)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO service_role;

-- 2. Drop existing restrictive policies on 'users'
DROP POLICY IF EXISTS "Users can see their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can see org members" ON public.users;

-- 3. Create a Permissive Debug Policy
-- WARNING: This allows any logged-in user to see ALL users.
-- We will remove this after debugging.
CREATE POLICY "Debug: Allow Read All" 
ON public.users 
FOR SELECT 
USING (auth.role() = 'authenticated');
