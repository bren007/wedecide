-- Migration: 20260330010000_extend_leads_for_secure_drop.sql
--
-- Adds missing columns to the leads table and ensures storage policies
-- for the audit_uploads bucket are correctly configured for staging.

-- 1. Extend Leads Table with missing columns
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS audit_status TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Ensure audit_uploads bucket exists and can be written to
DO $$ 
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('audit_uploads', 'audit_uploads', false)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- 3. Storage Policies
-- Allow anonymous upload (Secure Drop Page)
DROP POLICY IF EXISTS "Allow anonymous upload to audit_uploads" ON storage.objects;
CREATE POLICY "Allow anonymous upload to audit_uploads"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'audit_uploads');

-- Allow authenticated read (Admin Audit Review)
DROP POLICY IF EXISTS "Allow authenticated read audit_uploads" ON storage.objects;
CREATE POLICY "Allow authenticated read audit_uploads"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'audit_uploads');

-- Allow authenticated delete
DROP POLICY IF EXISTS "Allow authenticated delete audit_uploads" ON storage.objects;
CREATE POLICY "Allow authenticated delete audit_uploads"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'audit_uploads');

-- 4. Leads RLS: Allow updating via the RPC
-- Since the RPC is SECURITY DEFINER, it bypasses RLS for pure updates.
-- But we'll add this policy anyway if explicit updates from anon were ever intended.
DROP POLICY IF EXISTS "Allow anonymous update to lead status" ON public.leads;
CREATE POLICY "Allow anonymous update to lead status"
ON public.leads
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
