-- Fix meeting_groups updated_at default value (idempotent)
ALTER TABLE meeting_groups ALTER COLUMN updated_at SET DEFAULT NOW();
