-- Profiles mission statement support
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mission_statement TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mission_added_at TIMESTAMPTZ;


