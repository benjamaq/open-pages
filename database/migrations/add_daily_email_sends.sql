-- Idempotency log for daily reminder emails (prevents duplicates per local day)
CREATE TABLE IF NOT EXISTS daily_email_sends (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  local_date DATE NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (profile_id, local_date)
);

-- Optional helper index for recent queries
CREATE INDEX IF NOT EXISTS idx_daily_email_sends_sent_at ON daily_email_sends(sent_at DESC);

-- Ensure preferences has a last_email_sent_at column for UI/analytics (not used for locking)
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ;


