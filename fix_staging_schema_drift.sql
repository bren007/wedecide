-- Fix Schema Drift in Staging

-- 1. Fix meetings table defaults
ALTER TABLE meetings ALTER COLUMN status SET DEFAULT 'scheduled';
ALTER TABLE meetings ALTER COLUMN updated_at SET DEFAULT NOW();

-- 2. Fix agenda_items table defaults
ALTER TABLE agenda_items ALTER COLUMN updated_at SET DEFAULT NOW();

-- 3. Fix agenda_items foreign key to cascade (drop and recreate)
DO $$
BEGIN
  -- Try to find the constraint name. Usually it is agenda_items_meeting_id_fkey but good to be safe or just try drop
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agenda_items_meeting_id_fkey') THEN
    ALTER TABLE agenda_items DROP CONSTRAINT agenda_items_meeting_id_fkey;
  END IF;
END $$;

ALTER TABLE agenda_items 
ADD CONSTRAINT agenda_items_meeting_id_fkey 
FOREIGN KEY (meeting_id) 
REFERENCES meetings(id) 
ON DELETE CASCADE;

-- 4. Verify any bad data (optional, but good practice to just ensure we are clean)
-- (No data cleanup needed strictly for defaults, they apply to new rows)
