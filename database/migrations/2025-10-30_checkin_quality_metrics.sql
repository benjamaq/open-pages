-- Check-in data quality metrics
CREATE TABLE IF NOT EXISTS checkin_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
  is_first_checkin BOOLEAN DEFAULT FALSE,
  expandables_opened INTEGER DEFAULT 0,
  life_factors_count INTEGER DEFAULT 0,
  symptoms_count INTEGER DEFAULT 0,
  has_vibe BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER,
  save_intercept_shown BOOLEAN DEFAULT FALSE,
  save_intercept_clicked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quality_metrics_user ON checkin_quality_metrics(user_id, created_at DESC);


