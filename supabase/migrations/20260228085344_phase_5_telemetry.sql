-- Add Funnel Telemetry Columns to Leads Table

ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS payment_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS upload_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS decision_at TIMESTAMPTZ;

-- We will use the following string values for audit_status:
-- checkout_started, payment_secured, data_uploaded, draft_generated, report_delivered, license_won, license_lost
