-- Idempotent log for cohort shipping-gap nurture emails (days 4, 7, 10 after confirmation).
CREATE TABLE IF NOT EXISTS public.cohort_shipping_nurture_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  cohort_participant_id uuid NOT NULL REFERENCES public.cohort_participants (id) ON DELETE CASCADE,
  step text NOT NULL CHECK (step IN ('day4', 'day7', 'day10')),
  sent_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT cohort_shipping_nurture_sent_unique_step UNIQUE (cohort_participant_id, step)
);

CREATE INDEX IF NOT EXISTS idx_cohort_shipping_nurture_sent_participant ON public.cohort_shipping_nurture_sent (cohort_participant_id);

COMMENT ON TABLE public.cohort_shipping_nurture_sent IS 'Records Resend sends for post-confirmation shipping nurture (day 4/7/10).';

ALTER TABLE public.cohort_shipping_nurture_sent ENABLE ROW LEVEL SECURITY;

-- Admin / cron: service role only (no anon policies).

-- Confirmed participants with at least one daily check-in strictly after confirmation calendar day (UTC).
CREATE OR REPLACE FUNCTION public.count_cohort_confirmed_activated_participants (p_cohort_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM cohort_participants cp
  INNER JOIN profiles pr ON pr.id = cp.user_id
  -- cohort_id may be uuid or text (uuid string) across environments; compare as text.
  WHERE cp.cohort_id::text = p_cohort_id::text
    AND cp.status = 'confirmed'
    AND cp.confirmed_at IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM daily_entries de
      WHERE de.user_id = pr.user_id
        AND de.local_date IS NOT NULL
        AND de.local_date::date > (cp.confirmed_at AT TIME ZONE 'UTC')::date
    );
$$;

COMMENT ON FUNCTION public.count_cohort_confirmed_activated_participants (uuid) IS
  'Study activation: confirmed participants with ≥1 check-in on a calendar day after confirmed_at (UTC date).';

GRANT EXECUTE ON FUNCTION public.count_cohort_confirmed_activated_participants (uuid) TO service_role;
