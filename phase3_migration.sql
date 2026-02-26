-- Phase 3 Migrations for AlturaGov

-- 1. Initiatives: Add complexity score tracking
ALTER TABLE initiatives
ADD COLUMN IF NOT EXISTS complexity_stakeholder INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS complexity_tech INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS complexity_dependency INTEGER DEFAULT 1;

-- 2. Capacity Settings: Add Calibration wizard data
ALTER TABLE capacity_settings
ADD COLUMN IF NOT EXISTS calibration_large_steerable INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS calibration_historical_avg INTEGER DEFAULT 0;

-- 3. Leads (Audit Funnel): Add Scoping and Payment tracking
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS organization_name TEXT,
ADD COLUMN IF NOT EXISTS portfolio_scale TEXT,
ADD COLUMN IF NOT EXISTS primary_pain_point TEXT,
ADD COLUMN IF NOT EXISTS data_minimisation_acknowledged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS nda_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- 4. RPC Function for NZ Privacy Act "Purge Raw Data"
-- This can be called from the UI when an org completes their audit and wants to wipe the intake data.
CREATE OR REPLACE FUNCTION purge_audit_data(target_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- For now, purge the specific lead email to satisfy the privacy act after audit completion.
    DELETE FROM leads WHERE email = target_email;
END;
$$;
