CREATE OR REPLACE FUNCTION update_lead_by_email(p_email TEXT, p_status TEXT, p_file_url TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE leads 
    SET audit_status = p_status, 
        file_url = COALESCE(p_file_url, file_url)
    WHERE email = p_email;
END;
$$;
