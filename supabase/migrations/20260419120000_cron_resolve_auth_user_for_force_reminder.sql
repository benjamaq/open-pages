-- Resolve auth user by email for daily-reminder force=1&email= only (server-side RPC).
-- Joins cohort_participants → profiles → auth.users inside Postgres so the Data API
-- does not need access to auth.users. SECURITY DEFINER reads auth.users safely.

CREATE OR REPLACE FUNCTION public.cron_resolve_auth_user_for_force_reminder(target_email text)
RETURNS TABLE (auth_user_id uuid, canonical_email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT u.id AS auth_user_id, u.email AS canonical_email
  FROM public.cohort_participants cp
  INNER JOIN public.profiles p ON p.id = cp.user_id
  INNER JOIN auth.users u ON u.id = p.user_id
  WHERE target_email IS NOT NULL
    AND length(trim(target_email)) > 0
    AND lower(trim(u.email)) = lower(trim(target_email))
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.cron_resolve_auth_user_for_force_reminder(text) IS
  'Force-send daily reminder: map email to auth user via cohort enrollment. Callable only by service_role.';

REVOKE ALL ON FUNCTION public.cron_resolve_auth_user_for_force_reminder(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cron_resolve_auth_user_for_force_reminder(text) FROM anon;
REVOKE ALL ON FUNCTION public.cron_resolve_auth_user_for_force_reminder(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cron_resolve_auth_user_for_force_reminder(text) TO service_role;
