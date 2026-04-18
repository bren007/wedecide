-- Migration: 20260330000000_add_update_lead_by_email_rpc.sql
--
-- Adds the update_lead_by_email RPC function used by the Secure Drop Portal.
-- This function was previously applied as a one-off script and was never
-- tracked in migrations, causing it to be absent from staging.

CREATE OR REPLACE FUNCTION public.update_lead_by_email(
    p_email    TEXT,
    p_status   TEXT,
    p_file_url TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE leads
    SET
        audit_status = p_status,
        file_url     = COALESCE(p_file_url, file_url),
        updated_at   = NOW()
    WHERE email = p_email;
END;
$$;

-- Grant execute to anon and authenticated so the Secure Drop page
-- (which runs without a logged-in user) can call it.
GRANT EXECUTE ON FUNCTION public.update_lead_by_email(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_lead_by_email(TEXT, TEXT, TEXT) TO authenticated;
