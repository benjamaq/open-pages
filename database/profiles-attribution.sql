-- Add attribution columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_touch_source TEXT,
  ADD COLUMN IF NOT EXISTS last_touch_source TEXT,
  ADD COLUMN IF NOT EXISTS signup_utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS signup_utm_source TEXT,
  ADD COLUMN IF NOT EXISTS signup_utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS signup_referrer TEXT;


