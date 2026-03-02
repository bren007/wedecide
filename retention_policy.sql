-- Security & Retention (Phase 4)

-- 1. Function to delete raw CSV uploads older than 7 days
CREATE OR REPLACE FUNCTION purge_expired_raw_data()
RETURNS void AS $$
BEGIN
  -- We assume 'created_at' on the storage objects for audit_uploads
  DELETE FROM storage.objects 
  WHERE bucket_id = 'audit_uploads'
  AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to delete generated PDF reports older than 90 days
CREATE OR REPLACE FUNCTION purge_expired_reports()
RETURNS void AS $$
BEGIN
  DELETE FROM storage.objects 
  WHERE bucket_id = 'audit_reports'
  AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: If pg_cron is enabled on the Supabase instance, schedule these:
-- SELECT cron.schedule('purge_raw_data', '0 0 * * *', 'SELECT purge_expired_raw_data()');
-- SELECT cron.schedule('purge_reports', '0 1 * * *', 'SELECT purge_expired_reports()');
