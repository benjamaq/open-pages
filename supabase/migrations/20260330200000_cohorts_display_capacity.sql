-- Public-facing “spots” cap for study landing urgency (hero + progress bar).
-- Enrollment enforcement stays on max_participants.

ALTER TABLE public.cohorts
  ADD COLUMN IF NOT EXISTS display_capacity INTEGER;

COMMENT ON COLUMN public.cohorts.display_capacity IS
  'Optional smaller cap shown on the study page (spots remaining + progress). If null, max_participants is used for display math.';
