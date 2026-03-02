-- Phase 2: Strategic Governance Enhancements

-- 1. Meeting Snapshots
-- Store the full state of initiatives and capacity at start/end of meeting
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS snapshot_start JSONB DEFAULT '{}'::jsonb;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS snapshot_end JSONB DEFAULT '{}'::jsonb;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- 2. Refined Intake ("The Why")
-- Capture strategic justification for new initiatives
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS strategic_tradeoff TEXT;
