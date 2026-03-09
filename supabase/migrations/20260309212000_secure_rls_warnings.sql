-- 20260309212000_secure_rls_warnings.sql

-- Drop the legacy debug table if it exists
DROP TABLE IF EXISTS public.file_access_test;

-- Secure the migration history tracking table. 
-- By enabling RLS without creating any policies, default-deny applies for 'anon' and 'authenticated' roles.
-- The service_role and postgres roles bypass RLS automatically.
ALTER TABLE IF EXISTS public._migration_history ENABLE ROW LEVEL SECURITY;
