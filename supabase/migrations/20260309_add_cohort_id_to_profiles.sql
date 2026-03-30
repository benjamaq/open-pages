-- Add cohort_id to profiles for cohort report generation.
-- Step 1 of Cohort Report Generation System.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cohort_id TEXT DEFAULT NULL;
