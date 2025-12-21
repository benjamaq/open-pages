-- ============================================
-- USER PROFILE EXTENSIONS
-- ============================================
ALTER TABLE app_user 
ADD COLUMN IF NOT EXISTS health_priorities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS achievements_unlocked TEXT[] DEFAULT '{}';

COMMENT ON COLUMN app_user.health_priorities IS 'Ordered array of user priorities: [sleep, gut, cognitive]';

-- ============================================
-- CHECKIN EXTENSIONS
-- ============================================
ALTER TABLE checkin
ADD COLUMN IF NOT EXISTS stress_level TEXT CHECK (stress_level IN ('low', 'medium', 'high'));

COMMENT ON COLUMN checkin.stress_level IS 'User-reported stress level for contextual analysis';

-- ============================================
-- TRUTH REPORTS EXTENSIONS
-- ============================================
-- Create table if it does not exist so ALTER succeeds on fresh databases
CREATE TABLE IF NOT EXISTS supplement_truth_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_supplement_id UUID,
  canonical_id UUID,
  status TEXT,
  primary_metric TEXT,
  effect_direction TEXT,
  effect_size NUMERIC,
  absolute_change NUMERIC,
  percent_change NUMERIC,
  confidence_score NUMERIC,
  sample_days_on INT,
  sample_days_off INT,
  days_excluded_confounds INT,
  onset_days INT,
  responder_percentile NUMERIC,
  responder_label TEXT,
  confounds TEXT[],
  mechanism_inference TEXT,
  biology_profile TEXT,
  next_steps TEXT,
  science_note TEXT,
  raw_context JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE supplement_truth_reports 
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS primary_metric_key TEXT,
ADD COLUMN IF NOT EXISTS responder_type TEXT CHECK (responder_type IN ('super_responder', 'responder', 'non_responder')),
ADD COLUMN IF NOT EXISTS responder_phenotype TEXT,
ADD COLUMN IF NOT EXISTS pathway_signature TEXT,
ADD COLUMN IF NOT EXISTS biological_insights TEXT[],
ADD COLUMN IF NOT EXISTS onset_days INTEGER;

-- ============================================
-- MESSAGE HISTORY (prevents repeating messages)
-- ============================================
CREATE TABLE IF NOT EXISTS message_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_user(id) ON DELETE CASCADE,
  message_key TEXT NOT NULL,
  shown_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS message_history_user_idx 
  ON message_history(user_id, shown_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE message_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'message_history' AND policyname = 'Users can view own message history'
  ) THEN
    CREATE POLICY "Users can view own message history" ON message_history
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'message_history' AND policyname = 'System can insert message history'
  ) THEN
    CREATE POLICY "System can insert message history" ON message_history
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS checkin_user_date_idx 
  ON checkin(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_supplement_active_idx 
  ON user_supplement(user_id, is_active) WHERE is_active = true;

-- some installs name the date column 'date' or 'day' – keep generic intake_date if exists
DO $$
BEGIN
  IF to_regclass('public.supplement_intake_days') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supplement_intake_days' AND column_name = 'intake_date') THEN
      CREATE INDEX IF NOT EXISTS supplement_intake_days_lookup_idx 
        ON supplement_intake_days(user_supplement_id, intake_date);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supplement_intake_days' AND column_name = 'date') THEN
      CREATE INDEX IF NOT EXISTS supplement_intake_days_lookup_idx 
        ON supplement_intake_days(user_supplement_id, "date");
    END IF;
  END IF;
END $$;


