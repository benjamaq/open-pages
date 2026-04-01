-- Remove loadtest data (emails loadtest+<n>@biostackr.io).

BEGIN;

DELETE FROM public.daily_entries
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'loadtest+%@biostackr.io'
);

-- user_id may reference profiles.id (repo) or auth.users.id (some deployments)
DELETE FROM public.cohort_participants
WHERE user_id IN (
  SELECT p.id
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE u.email LIKE 'loadtest+%@biostackr.io'
)
OR user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'loadtest+%@biostackr.io'
);

DELETE FROM public.profiles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'loadtest+%@biostackr.io'
);

DELETE FROM auth.identities
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'loadtest+%@biostackr.io'
);

DELETE FROM auth.users
WHERE email LIKE 'loadtest+%@biostackr.io';

COMMIT;

-- GDPR-style single-participant template (adjust email):
-- DELETE FROM public.daily_entries WHERE user_id = (SELECT id FROM auth.users WHERE email = 'USER_EMAIL');
-- DELETE FROM public.cohort_participants WHERE user_id = (SELECT id FROM public.profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'USER_EMAIL'));
-- DELETE FROM public.profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'USER_EMAIL');
-- DELETE FROM auth.identities WHERE user_id = (SELECT id FROM auth.users WHERE email = 'USER_EMAIL');
-- DELETE FROM auth.users WHERE email = 'USER_EMAIL';
