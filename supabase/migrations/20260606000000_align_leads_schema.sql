-- Migration: Add missing columns and unique constraint to leads table

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS organization_name TEXT,
ADD COLUMN IF NOT EXISTS portfolio_scale TEXT,
ADD COLUMN IF NOT EXISTS primary_pain_point TEXT,
ADD COLUMN IF NOT EXISTS data_minimisation_acknowledged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS nda_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add UNIQUE constraint on email if not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'leads_email_key'
    ) THEN
        ALTER TABLE public.leads ADD CONSTRAINT leads_email_key UNIQUE (email);
    END IF;
END $$;
