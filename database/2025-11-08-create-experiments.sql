-- Experiments table (basic for MVP)

CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  intervention_id UUID REFERENCES stack_items(id),
  hypothesis TEXT,
  experiment_type TEXT, -- 'on_off'|'timing'|'dosage'
  start_date DATE,
  end_date DATE,
  status TEXT, -- 'active'|'completed'|'cancelled'
  baseline_avg JSONB,
  result_avg JSONB,
  conclusion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


