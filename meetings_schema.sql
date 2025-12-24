-- 1. Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  location TEXT, -- Could be a URL or physical location
  status TEXT DEFAULT 'scheduled' NOT NULL, -- scheduled, in_progress, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Agenda Items Table
CREATE TABLE IF NOT EXISTS agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Link Decisions to Agenda Items
ALTER TABLE decisions 
ADD COLUMN IF NOT EXISTS agenda_item_id UUID REFERENCES agenda_items(id) ON DELETE SET NULL;

-- 4. Enable RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;

-- 5. Policies for Meetings
DROP POLICY IF EXISTS "Users can view org meetings" ON meetings;
CREATE POLICY "Users can view org meetings" 
ON meetings FOR SELECT 
USING (organization_id IN (SELECT u.organization_id FROM users u WHERE u.id = auth.uid()::text));

DROP POLICY IF EXISTS "Admins can manage meetings" ON meetings;
CREATE POLICY "Admins can manage meetings" 
ON meetings FOR ALL 
USING (
  organization_id IN (SELECT u.organization_id FROM users u WHERE u.id = auth.uid()::text)
  AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair'))
);

-- 6. Policies for Agenda Items
DROP POLICY IF EXISTS "Users can view agenda items" ON agenda_items;
CREATE POLICY "Users can view agenda items" 
ON agenda_items FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM meetings m 
  WHERE m.id = agenda_items.meeting_id 
  AND m.organization_id IN (SELECT u.organization_id FROM users u WHERE u.id = auth.uid()::text)
));

DROP POLICY IF EXISTS "Admins can manage agenda items" ON agenda_items;
CREATE POLICY "Admins can manage agenda items" 
ON agenda_items FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM meetings m 
    WHERE m.id = agenda_items.meeting_id 
    AND m.organization_id IN (SELECT u.organization_id FROM users u WHERE u.id = auth.uid()::text)
    AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair'))
  )
);
