-- Pattern insights table for pre/post analysis results

CREATE TABLE IF NOT EXISTS pattern_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  intervention_id UUID REFERENCES stack_items(id),
  metric TEXT, -- 'sleep'|'energy'|'focus'|'recovery'
  effect_size NUMERIC,
  confidence_score NUMERIC, -- 0-100
  pre_mean NUMERIC,
  post_mean NUMERIC,
  sample_size INTEGER,
  status TEXT, -- 'preliminary'|'confirmed'|'no_effect'|'testing'
  last_updated TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prevent duplicate per (user, intervention, metric)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_user_intervention_metric'
  ) THEN
    ALTER TABLE pattern_insights 
      ADD CONSTRAINT uq_user_intervention_metric UNIQUE (user_id, intervention_id, metric);
  END IF;
END $$;


