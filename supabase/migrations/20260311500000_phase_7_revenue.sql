-- Phase 7: Revenue Infrastructure & Enterprise Provisioning
-- 1. Create audit_records table
CREATE TABLE IF NOT EXISTS public.audit_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchaser_email TEXT NOT NULL,
    stripe_session_id TEXT UNIQUE NOT NULL,
    audit_token TEXT UNIQUE NOT NULL,
    token_status TEXT DEFAULT 'unconsumed' NOT NULL, -- unconsumed, consumed
    status TEXT DEFAULT 'awaiting_csv' NOT NULL, -- awaiting_csv, processing, completed
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create license_transactions table
CREATE TABLE IF NOT EXISTS public.license_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT UNIQUE NOT NULL,
    amount INTEGER NOT NULL, -- in cents
    currency TEXT DEFAULT 'nzd' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Update organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS license_tier TEXT DEFAULT 'free';

-- 4. RLS Policies
ALTER TABLE public.audit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_transactions ENABLE ROW LEVEL SECURITY;

-- Only authenticated admins/system can read/manage audit_records
CREATE POLICY "Admins can manage audit_records" 
ON public.audit_records FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair')));

-- Only authenticated admins/system can read/manage license_transactions
CREATE POLICY "Admins can manage license_transactions" 
ON public.license_transactions FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair')));
