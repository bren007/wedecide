-- Migration: 20260822120000_add_leads_report_url.sql
-- Ensure report_url column exists on leads table and reload PostgREST schema cache.

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS report_url TEXT;

NOTIFY pgrst, 'reload schema';
