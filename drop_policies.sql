-- Drop existing RLS policies to allow schema migration
DROP POLICY IF EXISTS "Users can see their own org" ON organizations;
DROP POLICY IF EXISTS "Users can see their own user record" ON users;
DROP POLICY IF EXISTS "Users can see roles in their org" ON user_roles;
DROP POLICY IF EXISTS "Users can see their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own user record" ON users;
DROP POLICY IF EXISTS "Users can insert roles in their org" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own user record" ON users;
