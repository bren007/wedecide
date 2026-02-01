
-- Fix missing columns and Foreign Keys on stakeholders table in Staging

DO $$
BEGIN
    -- 1. Add user_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stakeholders' AND column_name='user_id') THEN
        RAISE NOTICE 'Adding user_id column...';
        ALTER TABLE stakeholders ADD COLUMN user_id uuid;
    ELSE
        RAISE NOTICE 'user_id column already exists.';
    END IF;

    -- 2. Decision FK (stakeholders -> decisions)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stakeholders_decision_id_fkey') THEN
        RAISE NOTICE 'Adding stakeholders_decision_id_fkey...';
        ALTER TABLE stakeholders ADD CONSTRAINT stakeholders_decision_id_fkey 
        FOREIGN KEY (decision_id) REFERENCES decisions(id) ON UPDATE CASCADE ON DELETE CASCADE;
    ELSE
         RAISE NOTICE 'stakeholders_decision_id_fkey already exists.';
    END IF;

    -- 3. User FK (stakeholders -> users)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stakeholders_user_id_fkey') THEN
        RAISE NOTICE 'Adding stakeholders_user_id_fkey...';
        ALTER TABLE stakeholders ADD CONSTRAINT stakeholders_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;
    ELSE
         RAISE NOTICE 'stakeholders_user_id_fkey already exists.';
    END IF;
    
    -- Reload schema cache
    PERFORM pg_notify('pgrst', 'reload schema');
END $$;
