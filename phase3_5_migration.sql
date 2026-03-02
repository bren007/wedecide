-- Phase 3.5 Migrations for AlturaGov

-- 1. Extend Leads Table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS audit_status TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- 2. Create Storage Bucket 'audit_uploads'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audit_uploads', 'audit_uploads', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies
DROP POLICY IF EXISTS "Allow anonymous upload to audit_uploads" ON storage.objects;
CREATE POLICY "Allow anonymous upload to audit_uploads"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'audit_uploads');

DROP POLICY IF EXISTS "Allow authenticated read audit_uploads" ON storage.objects;
CREATE POLICY "Allow authenticated read audit_uploads"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'audit_uploads');

DROP POLICY IF EXISTS "Allow authenticated delete audit_uploads" ON storage.objects;
CREATE POLICY "Allow authenticated delete audit_uploads"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'audit_uploads');

-- 4. Allow anon to update Leads record (for secure drop)
DROP POLICY IF EXISTS "Allow anonymous update to lead file_url" ON public.leads;
CREATE POLICY "Allow anonymous update to lead file_url"
ON public.leads
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
