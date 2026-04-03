-- Cohort dummy / load-test account cleanup (FK-safe order).
--
-- Targets:
--   A) Cohort participants enrolled on 2026-03-08 (UTC calendar day) whose auth.users row has
--      no email (NULL or blank). Use this for dummy rows like "Sarah J", "Mike Thompson", etc.
--   B) Users with email @mac.com where auth.users was created on 2026-03-30 (UTC date).
--
-- Date note: "08/03/2026" below is interpreted as 8 March 2026 (2026-03-08). Change literals if you meant 3 Aug 2026.
--
-- Deletes (order):
--   user_historical_data → dashboard_cache (if present) → daily_entries → stack_items (if present)
--   → cohort_participants → profiles → auth.identities → auth.user
--
-- Review first: run the PREVIEW CTE block below in a separate transaction or comment out COMMIT and inspect.

BEGIN;

-- Auth user IDs to remove (one row per auth user)
CREATE TEMP TABLE _cleanup_auth_ids ON COMMIT DROP AS
SELECT DISTINCT auth_id
FROM (
  SELECT u.id AS auth_id
  FROM auth.users u
  INNER JOIN public.profiles p ON p.user_id = u.id
  INNER JOIN public.cohort_participants cp ON cp.user_id = p.id
  WHERE
    (cp.enrolled_at AT TIME ZONE 'UTC')::date = DATE '2026-03-08'
    AND (u.email IS NULL OR length(trim(u.email)) = 0)
  UNION
  SELECT u.id AS auth_id
  FROM auth.users u
  WHERE u.email ILIKE '%@mac.com'
    AND (u.created_at AT TIME ZONE 'UTC')::date = DATE '2026-03-30'
  UNION
  SELECT u.id AS auth_id
  FROM auth.users u
  INNER JOIN public.profiles p ON p.user_id = u.id
  INNER JOIN public.cohort_participants cp ON cp.user_id = p.id
  WHERE u.email ILIKE '%@mac.com'
    AND (cp.enrolled_at AT TIME ZONE 'UTC')::date = DATE '2026-03-30'
) q;

-- Matching profiles.id (cohort_participants.user_id points here in repo migrations)
CREATE TEMP TABLE _cleanup_profile_ids ON COMMIT DROP AS
SELECT DISTINCT p.id AS profile_id
FROM public.profiles p
WHERE p.user_id IN (SELECT auth_id FROM _cleanup_auth_ids);

-- All UUIDs that may appear as user_id in daily_entries / user_historical_data (auth or profile PK)
CREATE TEMP TABLE _cleanup_all_user_uuids ON COMMIT DROP AS
SELECT auth_id AS uid FROM _cleanup_auth_ids
UNION
SELECT profile_id FROM _cleanup_profile_ids;

-- Optional: narrow to dummy display names only (uncomment AND clause if the date+empty-email set is too broad).
-- AND (
--   trim(lower(p.display_name)) IN (
--     'sarah j', 'mike thompson', 'emma wilson'
--   )
--   OR p.display_name IS NULL
-- )

-- PREVIEW (run manually: SELECT * FROM _cleanup_auth_ids; SELECT * FROM _cleanup_profile_ids;)

DELETE FROM public.user_historical_data uhd
WHERE uhd.user_id IN (SELECT uid FROM _cleanup_all_user_uuids);

DELETE FROM public.dashboard_cache dc
WHERE dc.user_id IN (SELECT uid FROM _cleanup_all_user_uuids);

DELETE FROM public.daily_entries de
WHERE de.user_id IN (SELECT uid FROM _cleanup_all_user_uuids);

DELETE FROM public.stack_items si
WHERE si.profile_id IN (SELECT profile_id FROM _cleanup_profile_ids);

-- cohort_participants references profiles(id) in standard schema; also delete if user_id stored as auth id
DELETE FROM public.cohort_participants cp
WHERE cp.user_id IN (SELECT profile_id FROM _cleanup_profile_ids)
   OR cp.user_id IN (SELECT auth_id FROM _cleanup_auth_ids);

DELETE FROM public.profiles pr
WHERE pr.id IN (SELECT profile_id FROM _cleanup_profile_ids);

DELETE FROM auth.identities i
WHERE i.user_id IN (SELECT auth_id FROM _cleanup_auth_ids);

DELETE FROM auth.users u
WHERE u.id IN (SELECT auth_id FROM _cleanup_auth_ids);

COMMIT;
