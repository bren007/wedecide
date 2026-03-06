-- Phase 6: Ambition vs. Reality — Command Center Schema Extensions
-- Adds governance classification fields to initiatives, fiscal drag threshold to capacity_settings,
-- and audit-to-licence handoff infrastructure to leads.

-- ============================================================
-- 1. INITIATIVES TABLE: Governance Classification Columns
-- ============================================================

ALTER TABLE initiatives
  ADD COLUMN IF NOT EXISTS approval_mandate TEXT
    CHECK (approval_mandate IN ('Cabinet Approved', 'Ministerial Approved', 'Board/Delegated', 'Pre-Approval')),
  ADD COLUMN IF NOT EXISTS relative_priority TEXT
    CHECK (relative_priority IN ('Tier 1', 'Tier 2', 'Tier 3')),
  ADD COLUMN IF NOT EXISTS target_delivery_quarter TEXT,
  ADD COLUMN IF NOT EXISTS current_fy_budget NUMERIC DEFAULT 0;

-- ============================================================
-- 2. CAPACITY_SETTINGS TABLE: Fiscal Drag Threshold
-- ============================================================

ALTER TABLE capacity_settings
  ADD COLUMN IF NOT EXISTS fiscal_drag_threshold NUMERIC DEFAULT NULL;

-- ============================================================
-- 3. LEADS TABLE: Audit-to-Licence Handoff Infrastructure
-- ============================================================

-- Audit token — unique reference printed on final PDF page
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS audit_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS audit_token_status TEXT DEFAULT 'unconsumed'
    CHECK (audit_token_status IN ('unconsumed', 'consumed', 'declined')),
  ADD COLUMN IF NOT EXISTS audit_parsed_json JSONB,
  ADD COLUMN IF NOT EXISTS audit_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS licence_org_id UUID;

-- Index on audit_token for fast lookup during import flow
CREATE INDEX IF NOT EXISTS idx_leads_audit_token ON leads(audit_token) WHERE audit_token IS NOT NULL;
