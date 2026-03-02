
-- Fix missing Foreign Keys on decisions table in Staging

DO $$
BEGIN
    -- 1. Owner FK (decisions -> users)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'decisions_owner_id_fkey') THEN
        RAISE NOTICE 'Adding decisions_owner_id_fkey...';
        ALTER TABLE decisions ADD CONSTRAINT decisions_owner_id_fkey 
        FOREIGN KEY (owner_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
    ELSE
        RAISE NOTICE 'decisions_owner_id_fkey already exists.';
    END IF;

    -- 2. Organization FK (decisions -> organizations)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'decisions_organization_id_fkey') THEN
        RAISE NOTICE 'Adding decisions_organization_id_fkey...';
        ALTER TABLE decisions ADD CONSTRAINT decisions_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON UPDATE CASCADE ON DELETE RESTRICT;
    ELSE
         RAISE NOTICE 'decisions_organization_id_fkey already exists.';
    END IF;
    
    -- Reload schema cache to pick up changes
    PERFORM pg_notify('pgrst', 'reload schema');
END $$;
