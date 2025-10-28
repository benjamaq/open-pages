-- Daily Email + Magic Check-in System Schema Updates
-- Date: 2025-10-27

-- 1) daily_entries: add checkin_method and is_placeholder
ALTER TABLE daily_entries 
  ADD COLUMN IF NOT EXISTS checkin_method TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN DEFAULT FALSE;

-- Constrain checkin_method to known values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'daily_entries_checkin_method_valid'
  ) THEN
    ALTER TABLE daily_entries 
      ADD CONSTRAINT daily_entries_checkin_method_valid 
      CHECK (checkin_method IN ('manual', 'magic', 'manual_copy'));
  END IF;
END $$;

-- Helpful index for lookups by user/date (idempotent if it already exists with same name)
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_date 
  ON daily_entries (user_id, local_date DESC);

-- Recommended analytics index to measure magic/manual_copy usage per user
CREATE INDEX IF NOT EXISTS idx_daily_entries_checkin_method 
  ON daily_entries (user_id, checkin_method) 
  WHERE checkin_method IN ('magic', 'manual_copy');

-- 2) notification_preferences: add daily_emails_enabled (distinct from general email_enabled)
ALTER TABLE notification_preferences 
  ADD COLUMN IF NOT EXISTS daily_emails_enabled BOOLEAN DEFAULT TRUE;

-- Ensure timezone column exists for local-time scheduling (defaults to UTC)
ALTER TABLE notification_preferences 
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Index to accelerate cron selection by enabled flag and timezone
CREATE INDEX IF NOT EXISTS idx_notification_prefs_daily_emails 
  ON notification_preferences (daily_emails_enabled, timezone) 
  WHERE daily_emails_enabled = TRUE;

-- 3) Magic check-in tokens (store token hash only)
--    We intentionally do not enable RLS here because this table is only accessed server-side
--    via a service role in the magic check-in endpoint.
CREATE TABLE IF NOT EXISTS magic_checkin_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,              -- hash of the raw token (never store raw token)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,      -- typically 24-48h expiry window
  used_at TIMESTAMPTZ,
  revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_magic_tokens_hash ON magic_checkin_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_magic_tokens_user_expires ON magic_checkin_tokens(user_id, expires_at);

-- Optional: clean-up helper (not a trigger), can be used by cron/maintenance
-- DELETE FROM magic_checkin_tokens WHERE (revoked = TRUE OR used_at IS NOT NULL OR expires_at < NOW()) AND created_at < NOW() - INTERVAL '7 days';


