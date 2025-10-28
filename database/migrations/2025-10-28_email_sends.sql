-- Email sends log for idempotence and analytics
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_sends_user_type_day
  ON email_sends (user_id, email_type, date_trunc('day', sent_at));


