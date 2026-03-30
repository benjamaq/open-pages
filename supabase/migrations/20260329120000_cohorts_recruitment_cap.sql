-- Recruitment window and capacity cap for cohort studies.

ALTER TABLE public.cohorts
  ADD COLUMN IF NOT EXISTS recruitment_closes_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_participants INTEGER;

COMMENT ON COLUMN public.cohorts.recruitment_closes_at IS 'If set and in the past, new applications are closed (study landing + apply).';
COMMENT ON COLUMN public.cohorts.max_participants IS 'If set, cap counts applied + confirmed cohort_participants toward this limit.';
