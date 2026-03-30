-- Minimum viable cohort size (for operational / wave-2 planning; display only in admin).

ALTER TABLE public.cohorts
  ADD COLUMN IF NOT EXISTS min_participants INTEGER;

COMMENT ON COLUMN public.cohorts.min_participants IS 'Target minimum confirmed size; below this with no new apps in 24h suggests another recruitment wave.';
