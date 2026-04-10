-- Cross-cohort isolation seed: 6 users across DoNotAge SureSleep + Seeking Health Optimal Focus.
--
-- PREREQUISITES (Supabase SQL Editor):
--   1. Run precheck_cohorts.sql — both cohorts active; bump COALESCE(display_capacity, max_participants)
--      temporarily if enrollment cap would block 2 applied + 2 confirmed rows per cohort (capacity trigger).
--   2. Run cleanup_test_users.sql first if isolation / loadtest users may already exist (same emails).
--   3. pgcrypto enabled (Supabase default) for extensions.crypt().
--
-- Matrix (password for all: IsolationTest_Seed_ChangeMe_9f3A!):
--   donotage-suresleep: cohort-isolation+dna-{applied,confirmed,active}@biostackr.io
--   seeking-health-optimal-focus: cohort-isolation+sh-{applied,confirmed,active}@biostackr.io
--
--   applied: status applied, no confirmed_at / study_started_at
--   confirmed: status confirmed, confirmed_at set, study_started_at NULL
--   active: status confirmed, study_started_at set (daily_entries row below for leakage check)
--
-- daily_entries.user_id = auth.users.id (same as loadtest corrected_seed).
-- cohort_participants.user_id follows cohort_participants_user_id_fkey (profiles.id vs auth.users.id).

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
  v.email,
  extensions.crypt('IsolationTest_Seed_ChangeMe_9f3A!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'name',
    replace(split_part(v.email, '@', 1), '+', ' '),
    'first_name',
    'Isolation'
  ),
  now(),
  now(),
  '',
  '',
  '',
  ''
FROM (
  VALUES
    ('cohort-isolation+dna-applied@biostackr.io'),
    ('cohort-isolation+dna-confirmed@biostackr.io'),
    ('cohort-isolation+dna-active@biostackr.io'),
    ('cohort-isolation+sh-applied@biostackr.io'),
    ('cohort-isolation+sh-confirmed@biostackr.io'),
    ('cohort-isolation+sh-active@biostackr.io')
) AS v(email);

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
WHERE u.email IN (
  'cohort-isolation+dna-applied@biostackr.io',
  'cohort-isolation+dna-confirmed@biostackr.io',
  'cohort-isolation+dna-active@biostackr.io',
  'cohort-isolation+sh-applied@biostackr.io',
  'cohort-isolation+sh-confirmed@biostackr.io',
  'cohort-isolation+sh-active@biostackr.io'
)
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
  );

INSERT INTO public.profiles (
  user_id,
  slug,
  display_name,
  public,
  reminder_enabled,
  reminder_time,
  timezone
)
SELECT
  u.id,
  'user-' || replace(u.id::text, '-', ''),
  coalesce(
    u.raw_user_meta_data->>'name',
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'Isolation'
  ),
  true,
  true,
  '09:00',
  'UTC'
FROM auth.users u
WHERE u.email IN (
  'cohort-isolation+dna-applied@biostackr.io',
  'cohort-isolation+dna-confirmed@biostackr.io',
  'cohort-isolation+dna-active@biostackr.io',
  'cohort-isolation+sh-applied@biostackr.io',
  'cohort-isolation+sh-confirmed@biostackr.io',
  'cohort-isolation+sh-active@biostackr.io'
)
ON CONFLICT (user_id) DO NOTHING;

UPDATE public.profiles p
SET
  cohort_id = CASE
    WHEN u.email LIKE 'cohort-isolation+dna-%@biostackr.io' THEN 'donotage-suresleep'
    WHEN u.email LIKE 'cohort-isolation+sh-%@biostackr.io' THEN 'seeking-health-optimal-focus'
    ELSE p.cohort_id
  END,
  updated_at = now()
FROM auth.users u
WHERE p.user_id = u.id
  AND u.email IN (
    'cohort-isolation+dna-applied@biostackr.io',
    'cohort-isolation+dna-confirmed@biostackr.io',
    'cohort-isolation+dna-active@biostackr.io',
    'cohort-isolation+sh-applied@biostackr.io',
    'cohort-isolation+sh-confirmed@biostackr.io',
    'cohort-isolation+sh-active@biostackr.io'
  );

-- One row per participant so capacity trigger sees correct counts (same pattern as loadtest corrected_seed).
DO $$
DECLARE
  v_confrel oid;
  v_use_auth_uid boolean;
  r RECORD;
BEGIN
  SELECT c.confrelid
  INTO v_confrel
  FROM pg_constraint c
  WHERE c.conname = 'cohort_participants_user_id_fkey'
    AND c.contype = 'f'
  LIMIT 1;

  v_use_auth_uid := (v_confrel IS NOT NULL AND v_confrel = to_regclass('auth.users')::oid);

  FOR r IN
    SELECT
      u.id AS auth_id,
      p.id AS profile_id,
      c.id AS cohort_uuid,
      spec.status::text AS pst,
      spec.enrolled_at AS enr,
      spec.confirmed_at AS cfm,
      spec.study_started_at AS ssa
    FROM auth.users u
    JOIN public.profiles p ON p.user_id = u.id
    JOIN (
      VALUES
        ('cohort-isolation+dna-applied@biostackr.io'::text, 'donotage-suresleep'::text, 'applied'::text, now() - interval '2 days', NULL::timestamptz, NULL::timestamptz),
        ('cohort-isolation+dna-confirmed@biostackr.io', 'donotage-suresleep', 'confirmed', now() - interval '8 days', now() - interval '6 days', NULL),
        ('cohort-isolation+dna-active@biostackr.io', 'donotage-suresleep', 'confirmed', now() - interval '14 days', now() - interval '12 days', now() - interval '7 days'),
        ('cohort-isolation+sh-applied@biostackr.io', 'seeking-health-optimal-focus', 'applied', now() - interval '2 days', NULL, NULL),
        ('cohort-isolation+sh-confirmed@biostackr.io', 'seeking-health-optimal-focus', 'confirmed', now() - interval '8 days', now() - interval '6 days', NULL),
        ('cohort-isolation+sh-active@biostackr.io', 'seeking-health-optimal-focus', 'confirmed', now() - interval '14 days', now() - interval '12 days', now() - interval '7 days')
    ) AS spec(email, cohort_slug, status, enrolled_at, confirmed_at, study_started_at)
      ON u.email = spec.email
    JOIN public.cohorts c ON c.slug = spec.cohort_slug
  LOOP
    INSERT INTO public.cohort_participants (
      user_id,
      cohort_id,
      status,
      enrolled_at,
      confirmed_at,
      study_started_at,
      currently_taking_product,
      qualification_response
    )
    VALUES (
      CASE WHEN v_use_auth_uid THEN r.auth_id ELSE r.profile_id END,
      r.cohort_uuid,
      r.pst,
      r.enr,
      r.cfm,
      r.ssa,
      false,
      'cohort isolation seed'
    )
    ON CONFLICT (user_id, cohort_id) DO UPDATE SET
      status = EXCLUDED.status,
      enrolled_at = EXCLUDED.enrolled_at,
      confirmed_at = EXCLUDED.confirmed_at,
      study_started_at = EXCLUDED.study_started_at,
      qualification_response = EXCLUDED.qualification_response;
  END LOOP;
END $$;

-- Leakage spot-check: sleep-shaped row (DNA active) vs cognitive-shaped row (SH active).
INSERT INTO public.daily_entries (
  user_id,
  local_date,
  sleep_quality,
  energy,
  mood,
  focus,
  mental_clarity,
  sleep_onset_bucket,
  night_wakes,
  supplement_intake,
  tags,
  created_at,
  updated_at
)
SELECT
  u.id,
  CURRENT_DATE,
  7::smallint,
  6::smallint,
  5::smallint,
  4::smallint,
  NULL::smallint,
  2::smallint,
  1::smallint,
  '{}'::jsonb,
  NULL::text[],
  now(),
  now()
FROM auth.users u
WHERE u.email = 'cohort-isolation+dna-active@biostackr.io'
ON CONFLICT (user_id, local_date) DO UPDATE SET
  sleep_quality = EXCLUDED.sleep_quality,
  energy = EXCLUDED.energy,
  mood = EXCLUDED.mood,
  focus = EXCLUDED.focus,
  mental_clarity = EXCLUDED.mental_clarity,
  sleep_onset_bucket = EXCLUDED.sleep_onset_bucket,
  night_wakes = EXCLUDED.night_wakes,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.daily_entries (
  user_id,
  local_date,
  sleep_quality,
  energy,
  mood,
  focus,
  mental_clarity,
  sleep_onset_bucket,
  night_wakes,
  supplement_intake,
  tags,
  created_at,
  updated_at
)
SELECT
  u.id,
  CURRENT_DATE,
  NULL::smallint,
  8::smallint,
  NULL::smallint,
  9::smallint,
  7::smallint,
  NULL::smallint,
  NULL::smallint,
  '{}'::jsonb,
  NULL::text[],
  now(),
  now()
FROM auth.users u
WHERE u.email = 'cohort-isolation+sh-active@biostackr.io'
ON CONFLICT (user_id, local_date) DO UPDATE SET
  sleep_quality = EXCLUDED.sleep_quality,
  energy = EXCLUDED.energy,
  mood = EXCLUDED.mood,
  focus = EXCLUDED.focus,
  mental_clarity = EXCLUDED.mental_clarity,
  sleep_onset_bucket = EXCLUDED.sleep_onset_bucket,
  night_wakes = EXCLUDED.night_wakes,
  updated_at = EXCLUDED.updated_at;

COMMIT;

-- Post-run checks (optional):
-- SELECT u.email, p.cohort_id, cp.status, cp.confirmed_at, cp.study_started_at
-- FROM auth.users u
-- JOIN public.profiles p ON p.user_id = u.id
-- JOIN public.cohort_participants cp ON cp.user_id = p.id OR cp.user_id = u.id
-- JOIN public.cohorts c ON c.id = cp.cohort_id
-- WHERE u.email LIKE 'cohort-isolation+%@biostackr.io'
-- ORDER BY u.email;
--
-- Preview (dev): GET /api/dev/cohort-email-preview?secret=$COHORT_EMAIL_PREVIEW_SECRET&template=enrollment&partnerBrandName=DoNotAge&productName=SureSleep
--   vs partnerBrandName=Seeking%20Health&productName=Optimal%20Focus
