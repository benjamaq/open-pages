-- User historical data table for CSV uploads (Whoop, Oura, Apple, manual)

CREATE TABLE IF NOT EXISTS user_historical_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  source TEXT, -- 'whoop'|'oura'|'apple'|'manual'
  date DATE NOT NULL,
  sleep_score NUMERIC,
  hrv NUMERIC,
  rhr NUMERIC,
  recovery_score NUMERIC,
  strain_score NUMERIC,
  energy_score NUMERIC,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prevent duplicate rows per user/source/date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_user_source_date'
  ) THEN
    ALTER TABLE user_historical_data 
      ADD CONSTRAINT uq_user_source_date UNIQUE (user_id, source, date);
  END IF;
END $$;


