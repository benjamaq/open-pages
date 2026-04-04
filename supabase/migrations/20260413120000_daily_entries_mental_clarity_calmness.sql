-- Additive cohort check-in metrics for additional studies (e.g. Seeking Health).
-- Nullable, no defaults, no backfill — existing rows and DoNotAge flow unchanged.

ALTER TABLE public.daily_entries
  ADD COLUMN IF NOT EXISTS mental_clarity INTEGER,
  ADD COLUMN IF NOT EXISTS calmness INTEGER;

COMMENT ON COLUMN public.daily_entries.mental_clarity IS
  'Cohort check-in: subjective 1–10 mental clarity when configured in cohorts.checkin_fields.';

COMMENT ON COLUMN public.daily_entries.calmness IS
  'Cohort check-in: subjective 1–10 calmness when configured in cohorts.checkin_fields.';
