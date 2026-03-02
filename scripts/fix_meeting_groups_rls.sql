
-- Fix RLS policies for meeting_groups (Assumes TEXT types based on inspection)

-- 1. Enable RLS (Ensure it is on)
ALTER TABLE meeting_groups ENABLE ROW LEVEL SECURITY;

-- 2. "Users can view org meeting groups"
DROP POLICY IF EXISTS "Users can view org meeting groups" ON meeting_groups;
CREATE POLICY "Users can view org meeting groups" 
ON meeting_groups FOR SELECT 
USING (
    -- organization_id is TEXT. users.organization_id is TEXT.
    -- auth.uid() is UUID. users.id is usually UUID, so we cast auth.uid() to match users.id? 
    -- inspection says users.id is ??? (Wait, inspected users, id row was likely 2, need to check output)
    -- Assuming users.id is UUID (standard), casting auth.uid() is NO-OP or explicitly UUID.
    -- But policy used auth.uid()::text
    -- If users.id is UUID, auth.uid()::text is WRONG for comparison? 
    -- Or if users.id is TEXT, then auth.uid()::text is CORRECT.
    
    -- Let's try casting BOTH sides to text to be safe if unsure, or removing cast if UUID.
    -- BEST GUESS: users.id is UUID. auth.uid() is UUID. 
    -- users.organization_id is TEXT. meeting_groups.organization_id is TEXT.
    
    organization_id IN (
        SELECT u.organization_id 
        FROM users u 
        WHERE u.id::text = auth.uid()::text -- robust comparison
    )
);

-- 3. "Admins can manage meeting groups"
DROP POLICY IF EXISTS "Admins can manage meeting groups" ON meeting_groups;
CREATE POLICY "Admins can manage meeting groups" 
ON meeting_groups FOR ALL 
USING (
    organization_id IN (
        SELECT u.organization_id 
        FROM users u 
        WHERE u.id::text = auth.uid()::text
    )
    AND EXISTS (
        SELECT 1 
        FROM user_roles ur 
        WHERE ur.user_id::text = auth.uid()::text -- robust comparison
        AND ur.role IN ('admin', 'chair')
    )
);
