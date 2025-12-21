-- Safe additive changes for Biohacker MVP
-- Phase 1: Add nullable columns (backfill and constraints later)

ALTER TABLE stack_items 
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS monthly_cost NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'supplement',
  ADD COLUMN IF NOT EXISTS time_of_day TEXT,
  ADD COLUMN IF NOT EXISTS dose TEXT;

-- Optional backfill can be executed later:
-- UPDATE stack_items SET start_date = created_at WHERE start_date IS NULL;
-- Then, later (Phase 3), enforce NOT NULL if desired:
-- ALTER TABLE stack_items ALTER COLUMN start_date SET NOT NULL;


