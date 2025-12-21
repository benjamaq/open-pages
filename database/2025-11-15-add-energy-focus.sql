-- Add energy and focus to daily_entries (optional 1-3)
ALTER TABLE daily_entries
  ADD COLUMN IF NOT EXISTS energy INTEGER CHECK (energy BETWEEN 1 AND 3),
  ADD COLUMN IF NOT EXISTS focus INTEGER CHECK (focus BETWEEN 1 AND 3);


