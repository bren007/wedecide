-- Fix ID defaults for all tables to ensure UUIDs are generated
-- This resolves the "null value in column id violates not-null constraint" error

-- Enable pgcrypto if not already enabled (standard in Supabase)
create extension if not exists "pgcrypto";

-- Organizations
ALTER TABLE organizations ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE organizations ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE organizations ALTER COLUMN updated_at SET DEFAULT now();

-- Users
-- Note: users.id might come from auth.uid() often, but good to have default
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT now();

-- User Roles
ALTER TABLE user_roles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE user_roles ALTER COLUMN created_at SET DEFAULT now();

-- Decisions
ALTER TABLE decisions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE decisions ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE decisions ALTER COLUMN updated_at SET DEFAULT now();

-- Stakeholders
ALTER TABLE stakeholders ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE stakeholders ALTER COLUMN created_at SET DEFAULT now();

-- Documents
ALTER TABLE documents ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE documents ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE documents ALTER COLUMN updated_at SET DEFAULT now();
