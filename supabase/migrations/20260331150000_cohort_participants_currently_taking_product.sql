-- Step A: store qualification outcome "not currently taking study product" (always false for enrolled participants).

ALTER TABLE public.cohort_participants
  ADD COLUMN IF NOT EXISTS currently_taking_product BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.cohort_participants.currently_taking_product IS
  'false = passed screening (not currently taking the study product). Applicants currently taking the product are excluded before account creation.';
