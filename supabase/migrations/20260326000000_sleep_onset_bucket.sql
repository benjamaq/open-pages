-- Cohort check-in: optional sleep onset bucket (SureSleep and future cohorts).
-- Standard users: column remains NULL. No changes to existing columns.

ALTER TABLE public.daily_entries
  ADD COLUMN IF NOT EXISTS sleep_onset_bucket SMALLINT DEFAULT NULL;

COMMENT ON COLUMN public.daily_entries.sleep_onset_bucket IS
  'Cohort check-in only. 1=<15min, 2=15–30, 3=30–60, 4=>60 min. NULL = not recorded.';
