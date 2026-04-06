-- One-time cleanup when a cohort participant graduates to main BioStackr (study done + Pro active).
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cohort_study_stack_cleaned_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS cohort_handoff_checkin_ignore_local_date text NULL;

COMMENT ON COLUMN public.profiles.cohort_study_stack_cleaned_at IS 'Set when the study-only stack item (cohort product name) is removed after handoff to main product.';
COMMENT ON COLUMN public.profiles.cohort_handoff_checkin_ignore_local_date IS 'YYYY-MM-DD (client local day): main dashboard treats as not checked in for that day only.';
