-- Supplement Logs: track whether user took a supplement on a given day

CREATE TABLE IF NOT EXISTS supplement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplement_id UUID NOT NULL,
  local_date DATE NOT NULL,
  taken BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique per day per supplement per user
CREATE UNIQUE INDEX IF NOT EXISTS supplement_logs_unique_idx
  ON supplement_logs(user_id, supplement_id, local_date);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS supplement_logs_user_date_idx
  ON supplement_logs(user_id, local_date DESC);

-- Enable RLS
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;

-- Policies: user can manage their own logs
DROP POLICY IF EXISTS "supplement_logs_select_own" ON supplement_logs;
DROP POLICY IF EXISTS "supplement_logs_insert_own" ON supplement_logs;
DROP POLICY IF EXISTS "supplement_logs_update_own" ON supplement_logs;

CREATE POLICY "supplement_logs_select_own"
  ON supplement_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "supplement_logs_insert_own"
  ON supplement_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "supplement_logs_update_own"
  ON supplement_logs FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE supplement_logs IS 'Per-day supplement taken logs';
COMMENT ON COLUMN supplement_logs.taken IS 'Whether supplement was taken on local_date';


