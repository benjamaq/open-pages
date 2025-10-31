-- Onboarding granular event tracking
CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  step_number INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_user ON onboarding_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_type ON onboarding_events(event_type, created_at DESC);

-- RLS policies (allow authenticated users to insert/select their own rows)
ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'onboarding_events' AND policyname = 'onboarding_events_insert'
  ) THEN
    CREATE POLICY onboarding_events_insert ON onboarding_events
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'onboarding_events' AND policyname = 'onboarding_events_select'
  ) THEN
    CREATE POLICY onboarding_events_select ON onboarding_events
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;


