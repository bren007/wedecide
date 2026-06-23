-- Migration: 20260606010000_fix_leads_anon_insert_policy.sql
--
-- DIAGNOSIS: The SecureDrop page (unauthenticated / anon role) was hitting
-- a 401 + RLS error (code 42501) when attempting to upsert into leads.
--
-- ROOT CAUSE: The INSERT policy granting anon access was only defined in
-- create_leads_table.sql (a one-off script), which was never tracked as a
-- Supabase migration. It was therefore never applied to the live database.
--
-- FIX: Recreate the policy idempotently here so it is tracked and applied.

-- Also ensure RLS is enabled (safe to run if already enabled)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the anonymous insert policy idempotently
DROP POLICY IF EXISTS "Allow anonymous inserts for leads" ON public.leads;
CREATE POLICY "Allow anonymous inserts for leads"
    ON public.leads
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Ensure the update policy also exists (needed for upsert conflict path)
DROP POLICY IF EXISTS "Allow anonymous update to lead status" ON public.leads;
CREATE POLICY "Allow anonymous update to lead status"
    ON public.leads
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Ensure authenticated users can read leads (admin review page)
DROP POLICY IF EXISTS "Allow authenticated read for leads" ON public.leads;
CREATE POLICY "Allow authenticated read for leads"
    ON public.leads
    FOR SELECT
    TO authenticated
    USING (true);
