-- Minimal column to designate the dashboard's primary insight
ALTER TABLE elli_messages
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_is_primary ON elli_messages(is_primary);


