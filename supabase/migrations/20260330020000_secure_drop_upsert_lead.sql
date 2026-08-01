-- Migration: Create secure_drop_upsert_lead function for Secure Drop
-- Allows upserting a lead with an uploaded file URL, bypassing RLS via SECURITY DEFINER.

CREATE OR REPLACE FUNCTION public.secure_drop_upsert_lead(
    p_email TEXT,
    p_file_url TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.leads (email, file_url, updated_at, audit_status)
    VALUES (p_email, p_file_url, NOW(), 'new')
    ON CONFLICT (email) DO UPDATE SET
        file_url = EXCLUDED.file_url,
        updated_at = NOW(),
        audit_status = EXCLUDED.audit_status;
END;
$$;

GRANT EXECUTE ON FUNCTION public.secure_drop_upsert_lead(TEXT, TEXT) TO anon, authenticated;
