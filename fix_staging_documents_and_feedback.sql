
-- Fix missing FKs for documents and create decision_feedback table in Staging

DO $$
BEGIN
    -- 1. Documents FKs
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_decision_id_fkey') THEN
        RAISE NOTICE 'Adding documents_decision_id_fkey...';
        ALTER TABLE documents ADD CONSTRAINT documents_decision_id_fkey 
        FOREIGN KEY (decision_id) REFERENCES decisions(id) ON UPDATE CASCADE ON DELETE CASCADE;
    ELSE
         RAISE NOTICE 'documents_decision_id_fkey already exists.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_organization_id_fkey') THEN
        RAISE NOTICE 'Adding documents_organization_id_fkey...';
        ALTER TABLE documents ADD CONSTRAINT documents_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON UPDATE CASCADE ON DELETE RESTRICT;
    ELSE
         RAISE NOTICE 'documents_organization_id_fkey already exists.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_uploaded_by_fkey') THEN
        RAISE NOTICE 'Adding documents_uploaded_by_fkey...';
        ALTER TABLE documents ADD CONSTRAINT documents_uploaded_by_fkey 
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
    ELSE
         RAISE NOTICE 'documents_uploaded_by_fkey already exists.';
    END IF;

    -- 2. Create decision_feedback table if missing
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'decision_feedback') THEN
        RAISE NOTICE 'Creating decision_feedback table...';
        CREATE TABLE decision_feedback (
             id uuid NOT NULL DEFAULT gen_random_uuid(),
             decision_id uuid NOT NULL,
             user_id uuid NOT NULL,
             content text NOT NULL,
             created_at timestamp without time zone NOT NULL DEFAULT now(),
             CONSTRAINT decision_feedback_pkey PRIMARY KEY (id),
             CONSTRAINT decision_feedback_decision_id_fkey FOREIGN KEY (decision_id) REFERENCES decisions(id) ON UPDATE CASCADE ON DELETE CASCADE,
             CONSTRAINT decision_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT
        );
    ELSE
         RAISE NOTICE 'decision_feedback table already exists.';
    END IF;

    -- 3. Check affected_parties FKs (just in case strictness varies)
    -- It has decision_id fk, checking if it needs anything else? No, simplified model.
    -- But let's check if it has organization_id? (Checking prisma... affected parties usually linked to decision).
    -- Prisma says model Decision { ... affected_parties ... } wait, AffectedParty model isn't in my viewed Prisma snippet?
    -- Ah, the snippet ended at line 220. Maybe AffectedParty is missing in my view?
    -- But inspect script showed 'affected_parties' table exists and has FK to decision. So it should be fine.

    -- Reload schema cache
    PERFORM pg_notify('pgrst', 'reload schema');
END $$;
