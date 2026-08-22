-- fix_leads_rls.sql
-- Add SELECT policy for anonymous users on leads table to allow upsert conflict checks
DROP POLICY IF EXISTS "Allow anonymous select for leads (email conflict check)" ON public.leads;
CREATE POLICY "Allow anonymous select for leads (email conflict check)"
    ON public.leads
    FOR SELECT
    TO anon
    USING (true);

