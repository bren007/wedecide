-- Drop ALL existing RLS policies to allow schema migration
-- This is a comprehensive script that removes all policies from all tables

-- Organizations
DROP POLICY IF EXISTS "Users can see their own org" ON organizations;

-- Users
DROP POLICY IF EXISTS "Users can see their own user record" ON users;
DROP POLICY IF EXISTS "Users can insert their own user record" ON users;
DROP POLICY IF EXISTS "Users can update their own user record" ON users;

-- User Roles
DROP POLICY IF EXISTS "Users can see roles in their org" ON user_roles;
DROP POLICY IF EXISTS "Users can see their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert roles in their org" ON user_roles;

-- Invitations
DROP POLICY IF EXISTS "Admins can view invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON invitations;
DROP POLICY IF EXISTS "Users can view their own invitation" ON invitations;

-- Drop any other policies that might exist
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;
