-- Capacity cap for cohort studies (confirmed participants vs max_participants).

ALTER TABLE public.cohorts
  ADD COLUMN IF NOT EXISTS max_participants INTEGER;

COMMENT ON COLUMN public.cohorts.max_participants IS 'Study accepts new applicants until confirmed cohort_participants reach this count.';
