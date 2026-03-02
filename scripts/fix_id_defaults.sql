-- Restore DEFAULT gen_random_uuid() for ID columns converted to TEXT

-- 1. Ensure pgcrypto or native uuid functions are available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Meetings
ALTER TABLE meetings ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 3. Meeting Groups
ALTER TABLE meeting_groups ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 4. Organizations
ALTER TABLE organizations ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 5. Users
-- Users ID usually comes from Auth, but having default is safe
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 6. User Roles
ALTER TABLE user_roles ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 7. Decisions? (Check if needed, likely yes)
ALTER TABLE decisions ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 8. Agenda Items
ALTER TABLE agenda_items ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 9. Meeting Attendees
ALTER TABLE meeting_attendees ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
