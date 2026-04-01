-- Load test seed: 60 auth users, profiles (via trigger + patch), cohort participants, 15 days daily_entries each.
--
-- PREREQUISITES (Supabase SQL Editor):
--   1. Run scripts/loadtest/cleanup.sql first if loadtest users may already exist.
--   2. Cohort slug 'donotage-suresleep' must exist in public.cohorts.
--   3. pgcrypto enabled (Supabase default) for extensions.crypt().
--   4. Ensure cohort capacity allows 60 NEW confirmed rows (COALESCE(display_capacity,max_participants)).
--
-- Schema notes:
--   daily_entries: sleep_quality, energy, mood, focus, sleep_onset_bucket, night_wakes (no outcomes JSONB).
--   daily_entries.user_id = auth.users.id; cohort_participants.user_id = profiles.id.

BEGIN;

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'loadtest+' || gs || '@biostackr.io',
  extensions.crypt('LoadTest_Seed_ChangeMe_9f3A!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'name', 'Load Test User ' || gs,
    'first_name', 'LoadTest'
  ),
  now(),
  now(),
  '',
  '',
  '',
  ''
FROM generate_series(1, 60) AS gs;

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  now(),
  now(),
  now()
FROM auth.users u
WHERE u.email LIKE 'loadtest+%@biostackr.io'
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
  );

UPDATE public.profiles p
SET
  cohort_id = 'donotage-suresleep',
  display_name = 'Load Test User ' || COALESCE(sub.n, 0),
  updated_at = now()
FROM auth.users u
CROSS JOIN LATERAL (
  SELECT NULLIF(substring(u.email FROM 'loadtest\+(\d+)@'), '')::int AS n
) sub
WHERE p.user_id = u.id
  AND u.email LIKE 'loadtest+%@biostackr.io';

-- One row at a time so the cohort capacity trigger sees correct pipeline counts
-- (bulk INSERT would not see sibling rows in the same statement).
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.id AS profile_id, c.id AS cohort_uuid
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    JOIN public.cohorts c ON c.slug = 'donotage-suresleep'
    WHERE u.email LIKE 'loadtest+%@biostackr.io'
  LOOP
    INSERT INTO public.cohort_participants (
      user_id,
      cohort_id,
      status,
      enrolled_at,
      confirmed_at,
      currently_taking_product,
      qualification_response
    )
    VALUES (
      r.profile_id,
      r.cohort_uuid,
      'confirmed',
      now() - interval '5 days',
      now() - interval '4 days',
      false,
      'loadtest seed'
    )
    ON CONFLICT (user_id, cohort_id) DO UPDATE SET
      status = EXCLUDED.status,
      enrolled_at = EXCLUDED.enrolled_at,
      confirmed_at = EXCLUDED.confirmed_at,
      qualification_response = EXCLUDED.qualification_response;
  END LOOP;
END $$;

INSERT INTO public.daily_entries (
  user_id,
  local_date,
  sleep_quality,
  energy,
  mood,
  focus,
  sleep_onset_bucket,
  night_wakes,
  supplement_intake,
  tags,
  created_at,
  updated_at
)
SELECT
  u.id,
  d.day::date,
  (5 + (abs(hashtext(u.id::text || d.day::text)) % 5))::smallint,
  (5 + (abs(hashtext(u.id::text || d.day::text || 'e')) % 5))::smallint,
  (5 + (abs(hashtext(u.id::text || d.day::text || 'm')) % 5))::smallint,
  (5 + (abs(hashtext(u.id::text || d.day::text || 'f')) % 5))::smallint,
  (1 + (abs(hashtext(u.id::text || d.day::text || 'b')) % 4))::smallint,
  (abs(hashtext(u.id::text || d.day::text || 'n')) % 3)::smallint,
  '{}'::jsonb,
  NULL::text[],
  now() - ((CURRENT_DATE - d.day::date) || ' days')::interval,
  now() - ((CURRENT_DATE - d.day::date) || ' days')::interval
FROM auth.users u
CROSS JOIN generate_series(
  (CURRENT_DATE - interval '14 days')::date,
  CURRENT_DATE::date,
  interval '1 day'
) AS d(day)
WHERE u.email LIKE 'loadtest+%@biostackr.io'
ON CONFLICT (user_id, local_date) DO UPDATE SET
  sleep_quality = EXCLUDED.sleep_quality,
  energy = EXCLUDED.energy,
  mood = EXCLUDED.mood,
  focus = EXCLUDED.focus,
  sleep_onset_bucket = EXCLUDED.sleep_onset_bucket,
  night_wakes = EXCLUDED.night_wakes,
  supplement_intake = EXCLUDED.supplement_intake,
  tags = EXCLUDED.tags,
  updated_at = EXCLUDED.updated_at;

COMMIT;
