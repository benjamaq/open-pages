-- Remove test / loadtest / isolation data (FK-safe order).
--
-- Matches auth.users.email:
--   ILIKE '%+test%@gmail.com'
--   OR LIKE 'loadtest+%@biostackr.io'
--   OR LIKE 'cohort-isolation+%@biostackr.io'
--
-- Review in a staging project first. If DELETE fails, extend with any FKs that reference
-- these users (e.g. cohort_reward_claims CASCADE from cohort_participants; add explicit deletes
-- for tables without ON DELETE CASCADE).

BEGIN;

CREATE TEMP TABLE _cleanup_auth_ids ON COMMIT DROP AS
SELECT id
FROM auth.users
WHERE
  email ILIKE '%+test%@gmail.com'
  OR email LIKE 'loadtest+%@biostackr.io'
  OR email LIKE 'cohort-isolation+%@biostackr.io';

CREATE TEMP TABLE _cleanup_profile_ids ON COMMIT DROP AS
SELECT DISTINCT p.id AS profile_id
FROM public.profiles p
WHERE p.user_id IN (SELECT id FROM _cleanup_auth_ids);

CREATE TEMP TABLE _cleanup_all_user_uuids ON COMMIT DROP AS
SELECT id AS uid FROM _cleanup_auth_ids
UNION
SELECT profile_id FROM _cleanup_profile_ids;

DELETE FROM public.cohort_participant_results cpr
WHERE cpr.user_id IN (SELECT id FROM _cleanup_auth_ids);

DELETE FROM public.user_historical_data uhd
WHERE uhd.user_id IN (SELECT uid FROM _cleanup_all_user_uuids);

DELETE FROM public.dashboard_cache dc
WHERE dc.user_id IN (SELECT uid FROM _cleanup_all_user_uuids);

DELETE FROM public.daily_entries de
WHERE de.user_id IN (SELECT uid FROM _cleanup_all_user_uuids);

DELETE FROM public.stack_items si
WHERE si.profile_id IN (SELECT profile_id FROM _cleanup_profile_ids);

DELETE FROM public.cohort_participants cp
WHERE cp.user_id IN (SELECT profile_id FROM _cleanup_profile_ids)
   OR cp.user_id IN (SELECT id FROM _cleanup_auth_ids);

DELETE FROM public.profiles pr
WHERE pr.user_id IN (SELECT id FROM _cleanup_auth_ids);

DELETE FROM auth.identities i
WHERE i.user_id IN (SELECT id FROM _cleanup_auth_ids);

DELETE FROM auth.users u
WHERE u.id IN (SELECT id FROM _cleanup_auth_ids);

COMMIT;
