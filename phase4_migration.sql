-- Phase 4 Migrations for AlturaGov

-- 1. Extend Leads Table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS report_url TEXT;

-- 2. Create Storage Bucket 'audit_reports'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audit_reports', 'audit_reports', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies
DROP POLICY IF EXISTS "Allow authenticated insert to audit_reports" ON storage.objects;
CREATE POLICY "Allow authenticated insert to audit_reports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audit_reports');

DROP POLICY IF EXISTS "Allow authenticated read audit_reports" ON storage.objects;
CREATE POLICY "Allow authenticated read audit_reports"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'audit_reports');

DROP POLICY IF EXISTS "Allow anonymous read audit_reports" ON storage.objects;
CREATE POLICY "Allow anonymous read audit_reports"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'audit_reports');

-- Note: We allow anonymous users to read audit_reports (for downloading their specific link), 
-- but only authenticated functions/admins can create them.
