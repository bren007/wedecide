-- Fix ID types to UUID on Staging (initiatives exists, others do not)
ALTER TABLE initiatives ALTER COLUMN org_id TYPE UUID USING org_id::uuid;
ALTER TABLE initiatives ALTER COLUMN owner_id TYPE UUID USING owner_id::uuid;
