-- Timezone support for daily emails
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
CREATE INDEX IF NOT EXISTS idx_profiles_timezone ON profiles(timezone);


