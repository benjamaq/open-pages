-- Add lifestyle factors to daily_entries for lifestyle pattern insights
ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS lifestyle_factors TEXT[] DEFAULT '{}'::text[];

-- Optional: index for containment queries if needed later
CREATE INDEX IF NOT EXISTS idx_daily_entries_lifestyle_factors_gin
  ON daily_entries USING gin (lifestyle_factors);


