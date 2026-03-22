-- Phase 7.5: Capacity Calibration Alignment
-- Adds calibration inputs and calculated baseline to leads table.
-- Retains portfolio_scale column (deprecated, no new code reads it).

-- 1. Context-only initiative count (replaces portfolio_scale semantically)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS portfolio_context_count INTEGER;

-- 2. Calibration inputs (recorded by Lead Strategist from Slot-Sync Session)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS calibration_large_steerable INTEGER;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS calibration_historical_avg INTEGER;

-- 3. Calculated baseline (stored at report generation time, transferred on token consumption)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS capacity_baseline INTEGER;
