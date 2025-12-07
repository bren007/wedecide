-- TEMPORARY: Disable RLS for testing signup flow
-- This will help us verify if the signup logic works
-- We'll re-enable it after testing

-- Disable RLS on tables needed for signup
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Note: This is ONLY for testing! 
-- After signup works, we'll re-enable RLS and fix the policies properly
