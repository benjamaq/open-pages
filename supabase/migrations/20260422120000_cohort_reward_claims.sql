-- Per-participant cohort completion reward (token-based claim for Pro extension).

CREATE TABLE IF NOT EXISTS public.cohort_reward_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_participant_id UUID NOT NULL REFERENCES public.cohort_participants (id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  token TEXT NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'pro_3_months',
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cohort_reward_claims_token_unique UNIQUE (token),
  CONSTRAINT cohort_reward_claims_one_per_participant UNIQUE (cohort_participant_id)
);

COMMENT ON TABLE public.cohort_reward_claims IS 'Single-use token issued at study completion; bearer claims extend Pro via profiles.pro_expires_at.';
COMMENT ON COLUMN public.cohort_reward_claims.user_id IS 'Auth user who claimed; null until claimed.';

CREATE INDEX IF NOT EXISTS idx_cohort_reward_claims_token ON public.cohort_reward_claims (token)
  WHERE claimed_at IS NULL;

ALTER TABLE public.cohort_reward_claims ENABLE ROW LEVEL SECURITY;
