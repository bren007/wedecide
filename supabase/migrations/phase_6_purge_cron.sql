-- Function to automatically purge sensitive audit JSON data after 60 days
-- This ensures customer portfolio data isn't retained indefinitely if they don't import.
CREATE OR REPLACE FUNCTION purge_stale_audit_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Nullify the parsed JSON to save space and remove sensitive customer portfolio data.
  -- Kept: audit_token, audit_token_status, audit_completed_at for analytics/billing tracking.
  UPDATE public.leads
  SET audit_parsed_json = NULL
  WHERE audit_completed_at < NOW() - INTERVAL '60 days'
    AND audit_parsed_json IS NOT NULL;
END;
$$;

-- NOTE FOR DEPLOYMENT:
-- To execute this automatically, ensure the pg_cron extension is enabled on your Supabase project
-- (Database > Extensions > pg_cron).
-- Then, run the following command directly in the Supabase SQL Editor to schedule it daily at midnight:
-- 
-- SELECT cron.schedule(
--   'purge_audit_data_daily',
--   '0 0 * * *',
--   'SELECT purge_stale_audit_data();'
-- );
