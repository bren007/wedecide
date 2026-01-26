-- Add reversibility_type field to decisions table

ALTER TABLE decisions 
ADD COLUMN IF NOT EXISTS reversibility_type TEXT CHECK (reversibility_type IN ('type1_irreversible', 'type2_reversible'));

-- Create index for filtering by reversibility type
CREATE INDEX IF NOT EXISTS idx_decisions_reversibility ON decisions(reversibility_type);
