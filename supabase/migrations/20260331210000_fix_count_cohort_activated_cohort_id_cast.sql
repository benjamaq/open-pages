-- Repair: count_cohort_confirmed_activated_participants failed when cohort_participants.cohort_id
-- was text and p_cohort_id was uuid (42883). Re-create with text-safe comparison.

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

GRANT EXECUTE ON FUNCTION public.count_cohort_confirmed_activated_participants (uuid) TO service_role;
