-- Stage 1: Schema Hardening

-- Rename focus_slots_required to focus_slots for consistency
-- ALTER TABLE initiatives RENAME COLUMN focus_slots_required TO focus_slots;

-- Add new columns
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS dependency_count INTEGER DEFAULT 0;
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS novelty_score INTEGER DEFAULT 1 CHECK (novelty_score BETWEEN 1 AND 5);
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS bottleneck_roles JSONB DEFAULT '[]'::jsonb;
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS funding_status TEXT CHECK (funding_status IN ('funded', 'partially_funded', 'not_funded', 'pending')) DEFAULT 'pending';
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS value_drop TEXT;
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS coi_amount NUMERIC DEFAULT 0;
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS coi_months INTEGER DEFAULT 0;
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS sponsor TEXT;

-- Ensure status default is 'proposed' (already set, but reinforcing)
ALTER TABLE initiatives ALTER COLUMN status SET DEFAULT 'proposed';

-- Update RLS policies if needed (existing ones seem broad enough for now, but double check)
-- Existing: "Propose initiatives" FOR INSERT WITH CHECK (org_id = get_auth_user_org_id());
-- Existing: "Update own proposed initiatives" ...
-- These should cover the new columns for updates.

-- Enable Realtime for initiatives if not already (Supabase usually needs explicit enable for some things, but tables are usually fine)
-- altering table to add to publication if needed, usually 'supabase_realtime' publication exists.
-- alter publication supabase_realtime add table initiatives; -- Uncomment if needed, but usually handled by dashboard or setup.
