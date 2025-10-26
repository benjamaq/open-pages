-- Create table for user insight preferences (pin/hide with expiry)
CREATE TABLE IF NOT EXISTS user_insight_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  insight_key TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('pin', 'hide')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, insight_key, action)
);

CREATE INDEX IF NOT EXISTS idx_preferences_expiry
  ON user_insight_preferences(expires_at)
  WHERE expires_at > NOW();


