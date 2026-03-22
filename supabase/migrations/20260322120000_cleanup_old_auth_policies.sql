-- Migration: Cleanup old auth policies that were manually removed from Dev during auth loop debugging
-- This ensures Staging mirrors Dev exactly by dropping these policies.

DROP POLICY IF EXISTS "signup_insert_user" ON users;
DROP POLICY IF EXISTS "users_read_org_members" ON users;
