-- Restore DEFAULT now() for updated_at columns

-- 1. Meetings
ALTER TABLE meetings ALTER COLUMN updated_at SET DEFAULT now();

-- 2. Meeting Groups
ALTER TABLE meeting_groups ALTER COLUMN updated_at SET DEFAULT now();

-- 3. Organizations
ALTER TABLE organizations ALTER COLUMN updated_at SET DEFAULT now();

-- 4. Users
ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT now();

-- 5. User Roles (likely doesn't have updated_at or is optional? Debug showed null default)
-- If column exists and is not null, it needs default.
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'updated_at') THEN
        ALTER TABLE user_roles ALTER COLUMN updated_at SET DEFAULT now();
    END IF;
END $$;

-- 6. Decisions
ALTER TABLE decisions ALTER COLUMN updated_at SET DEFAULT now();

-- 7. Agenda Items
ALTER TABLE agenda_items ALTER COLUMN updated_at SET DEFAULT now();

-- 8. Meeting Attendees
ALTER TABLE meeting_attendees ALTER COLUMN updated_at SET DEFAULT now();
