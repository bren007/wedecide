-- Phase 8: Invoice Requests table for human-in-the-loop procurement workflow
-- Triggered when a government procurement officer clicks "Request Invoice"

create table public.invoice_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  work_email text not null,
  phone text not null,
  agency text not null,
  selected_tier text not null check (selected_tier in ('6-Month Pilot — $9,500', 'Annual Enterprise Licence — $25,000')),
  po_number text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'invoiced', 'paid', 'cancelled')),
  manually_activated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS — only service role can read/write (no anon/user access)
alter table public.invoice_requests enable row level security;

-- No policies means only service role / admin can access
-- This is intentional — requests are sensitive procurement data

comment on table public.invoice_requests is 'Procurement invoice requests from government agencies. Human-in-the-loop: Lead Strategist issues manual invoice within 24 hours.';
comment on column public.invoice_requests.manually_activated is 'Admin override to activate tenant licence if Stripe webhook fails. Set via admin panel.';
