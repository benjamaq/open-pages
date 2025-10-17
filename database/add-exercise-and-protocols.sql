-- Exercise columns
ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS exercise_type TEXT,
ADD COLUMN IF NOT EXISTS exercise_intensity TEXT;

-- Protocols column (text[] for simple tags)
ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS protocols TEXT[] DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_daily_entries_protocols_gin ON daily_entries USING gin (protocols);


