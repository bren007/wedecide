-- Migration: Add Friction Coefficient to Leads and Capacity Settings
-- Dynamic scaling for public-sector compliance and matrixed organizational drag.

-- ============================================================
-- 1. LEADS TABLE: Friction Coefficient Column
-- ============================================================
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS friction_coefficient NUMERIC(3,2) NOT NULL DEFAULT 1.00
    CHECK (friction_coefficient >= 1.00 AND friction_coefficient <= 2.50);

-- ============================================================
-- 2. CAPACITY_SETTINGS TABLE: Friction Coefficient Column
-- ============================================================
ALTER TABLE capacity_settings
  ADD COLUMN IF NOT EXISTS friction_coefficient NUMERIC(3,2) NOT NULL DEFAULT 1.00
    CHECK (friction_coefficient >= 1.00 AND friction_coefficient <= 2.50);
