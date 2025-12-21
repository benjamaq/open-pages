-- Visual supplement period tracking - periods per stack item (intervention)
-- We align "intervention" to existing "stack_items" table in this codebase

CREATE TABLE IF NOT EXISTS intervention_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervention_id UUID REFERENCES stack_items(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL = currently active
  dose TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_intervention_periods_intervention_id ON intervention_periods (intervention_id);
CREATE INDEX IF NOT EXISTS idx_intervention_periods_start_date ON intervention_periods (start_date);


