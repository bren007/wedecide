-- Make user_id optional in stakeholders table
ALTER TABLE stakeholders ALTER COLUMN user_id DROP NOT NULL;

-- Ensure there's an index on user_id if we want to query by it later
CREATE INDEX IF NOT EXISTS idx_stakeholders_user_id ON stakeholders(user_id);
