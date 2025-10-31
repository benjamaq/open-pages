-- Check-in data quality metrics (composite FK to daily_entries)
CREATE TABLE IF NOT EXISTS checkin_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_local_date DATE NOT NULL,
  is_first_checkin BOOLEAN DEFAULT FALSE,
  expandables_opened INTEGER DEFAULT 0,
  life_factors_count INTEGER DEFAULT 0,
  symptoms_count INTEGER DEFAULT 0,
  has_vibe BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER,
  save_intercept_shown BOOLEAN DEFAULT FALSE,
  save_intercept_clicked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_quality_entry FOREIGN KEY (user_id, entry_local_date)
    REFERENCES daily_entries(user_id, local_date) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quality_metrics_user ON checkin_quality_metrics(user_id, created_at DESC);

-- RLS policies (allow authenticated users to insert/select their own rows)
ALTER TABLE checkin_quality_metrics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'checkin_quality_metrics' AND policyname = 'checkin_quality_metrics_insert'
  ) THEN
    CREATE POLICY checkin_quality_metrics_insert ON checkin_quality_metrics
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'checkin_quality_metrics' AND policyname = 'checkin_quality_metrics_select'
  ) THEN
    CREATE POLICY checkin_quality_metrics_select ON checkin_quality_metrics
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;


