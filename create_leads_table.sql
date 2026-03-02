-- Migration: Create Leads Table for AlturaGov Public Showroom
-- Theme: Lead Capture / Strategic Audit

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    email TEXT NOT NULL,
    organization TEXT,
    role TEXT,
    pain_point TEXT
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public lead capture)
CREATE POLICY "Allow anonymous inserts for leads"
    ON public.leads
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Only admins/authenticated system can read
CREATE POLICY "Allow authenticated read for leads"
    ON public.leads
    FOR SELECT
    TO authenticated
    USING (true);
