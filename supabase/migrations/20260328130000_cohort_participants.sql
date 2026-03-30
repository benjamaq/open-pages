-- Study enrollment + compliance tracking: links profiles (participant) to cohorts (UUID).

CREATE TABLE IF NOT EXISTS public.cohort_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  cohort_id UUID NOT NULL REFERENCES public.cohorts (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'applied'
    CHECK (status IN ('applied', 'confirmed', 'dropped', 'completed')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  dropped_at TIMESTAMPTZ,
  UNIQUE (user_id, cohort_id)
);

CREATE INDEX IF NOT EXISTS idx_cohort_participants_status ON public.cohort_participants (status);
CREATE INDEX IF NOT EXISTS idx_cohort_participants_enrolled_at ON public.cohort_participants (enrolled_at);
CREATE INDEX IF NOT EXISTS idx_cohort_participants_cohort_status ON public.cohort_participants (cohort_id, status);

ALTER TABLE public.cohort_participants ENABLE ROW LEVEL SECURITY;
