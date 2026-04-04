-- Broaden cohort → profile link: some rows use cohort_participants.user_id = profiles.id;
-- others may use cohort_participants.user_id = profiles.user_id (auth UUID). Prior version
-- only matched the former, so RPC returned no row while PostgREST auth was unusable.

CREATE OR REPLACE FUNCTION public.cron_resolve_auth_user_for_force_reminder(target_email text)
RETURNS TABLE (auth_user_id uuid, canonical_email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT u.id AS auth_user_id, u.email::text AS canonical_email
  FROM auth.users u
  WHERE target_email IS NOT NULL
    AND length(trim(target_email)) > 0
    AND lower(trim(u.email)) = lower(trim(target_email))
    AND EXISTS (
      SELECT 1
      FROM public.cohort_participants cp
      INNER JOIN public.profiles p
        ON p.id = cp.user_id
        OR p.user_id = cp.user_id
      WHERE p.user_id = u.id
    )
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.cron_resolve_auth_user_for_force_reminder(text) IS
  'Force-send daily reminder: email → auth user iff enrolled in a cohort (profile id or auth id on cohort_participants.user_id).';
