-- ============================================================================
-- Launch / pre-prod: delete ALL test users matching email patterns (FK-safe).
--
-- Prerequisites: run as a role that can DELETE from auth.users and auth.identities
-- (e.g. Supabase SQL Editor as postgres / service role migration).
--
-- BEFORE YOU RUN: optionally uncomment the temp-table preview SELECTs below.
-- This file performs REAL DELETES inside a single transaction.
--
-- ---------------------------------------------------------------------------
-- Introspection: every foreign key TO public.profiles (re-run on your DB)
-- ---------------------------------------------------------------------------
-- SELECT tc.table_schema,
--        tc.table_name,
--        kcu.column_name,
--        ccu.table_schema AS fk_to_schema,
--        ccu.table_name   AS fk_to_table,
--        ccu.column_name  AS fk_to_column
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
--   AND tc.table_schema = kcu.table_schema
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
--   AND ccu.table_schema = tc.table_schema
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--   AND ccu.table_schema = 'public'
--   AND ccu.table_name = 'profiles'
-- ORDER BY tc.table_schema, tc.table_name, kcu.column_name;
--
-- Repo-known dependents on profiles.id or profiles.user_id include (non-exhaustive
-- if your DB has extra tables): cohort_participants.user_id, stack_items.profile_id,
-- protocols.profile_id, uploads.profile_id, gear.profile_id, library(_items).profile_id,
-- journal_entries.profile_id, shop_gear_items.profile_id, daily_updates.profile_id,
-- daily_update_shares.profile_id, notification_queue.profile_id,
-- notification_preferences.profile_id, magic_checkin_tokens.profile_id (if present),
-- profiles.referred_by (self-FK), daily_email_sends.profile_id (legacy schema),
-- intervention_periods (via stack_items), plus app_user / avatars as in script below.
--
-- public.experiments (if present): DELETE runs only for columns that exist (user_id
-- and/or profile_id) via EXECUTE so the DO block still compiles when the shape differs.
-- ============================================================================

BEGIN;

CREATE TEMP TABLE _cleanup_auth_ids ON COMMIT DROP AS
SELECT id
FROM auth.users
WHERE
  email LIKE '%invalidate.test%'
  OR email LIKE 'launch-seed%'
  OR email LIKE 'findbenhere+flow%'
  OR email LIKE 'findbenhere+mika%'
  OR email LIKE 'findbenhere+mario%'
  OR email LIKE 'findbenhere+sia%'
  OR email LIKE 'findbenhere+gate%'
  OR email LIKE 'findbenhere+skippy%'
  OR email LIKE 'cohortfin%'
  OR email LIKE 'cohort2%'
  OR email LIKE 'cohortpt2%'
  OR email LIKE 'captest%'
  OR email LIKE 'ben09%'
  OR email LIKE 'ben0%@mac.com'
  OR email LIKE 'tittis%'
  OR email LIKE 'iodood%'
  OR email LIKE 'zoe538%'
  OR email LIKE 'leerobson%';

CREATE TEMP TABLE _cleanup_profile_ids ON COMMIT DROP AS
SELECT id
FROM public.profiles
WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);

CREATE TEMP TABLE _cleanup_all_uuids ON COMMIT DROP AS
SELECT id AS uid FROM _cleanup_auth_ids
UNION
SELECT id FROM _cleanup_profile_ids;

-- Optional: inspect targets (uncomment)
-- SELECT * FROM _cleanup_auth_ids;
-- SELECT * FROM _cleanup_profile_ids;

-- ============================================================================
-- DELETES (FK-safe order; missing tables skipped via to_regclass / column checks)
-- ============================================================================
DO $$
BEGIN
  -- Self-FK on profiles: non-test users may reference test profiles as referrer
  IF to_regclass('public.profiles') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'referred_by'
     ) THEN
    UPDATE public.profiles
    SET referred_by = NULL
    WHERE referred_by IN (SELECT id FROM _cleanup_profile_ids);
  END IF;

  IF to_regclass('public.effect_history') IS NOT NULL AND to_regclass('public.user_supplement_effect') IS NOT NULL THEN
    DELETE FROM public.effect_history
    WHERE user_supplement_effect_id IN (
      SELECT id FROM public.user_supplement_effect WHERE user_id IN (SELECT id FROM _cleanup_auth_ids)
    );
  END IF;

  IF to_regclass('public.user_supplement_effect') IS NOT NULL THEN
    DELETE FROM public.user_supplement_effect WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.supplement_truth_reports') IS NOT NULL THEN
    DELETE FROM public.supplement_truth_reports WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.supplement_intake_days') IS NOT NULL AND to_regclass('public.user_supplement') IS NOT NULL THEN
    DELETE FROM public.supplement_intake_days
    WHERE user_supplement_id IN (SELECT id FROM public.user_supplement WHERE user_id IN (SELECT id FROM _cleanup_auth_ids));
  END IF;

  IF to_regclass('public.daily_metrics') IS NOT NULL THEN
    DELETE FROM public.daily_metrics WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.daily_processed_scores') IS NOT NULL THEN
    DELETE FROM public.daily_processed_scores WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.effect_summary') IS NOT NULL THEN
    DELETE FROM public.effect_summary WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.pattern_insights') IS NOT NULL THEN
    DELETE FROM public.pattern_insights WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.validation_test') IS NOT NULL THEN
    DELETE FROM public.validation_test WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.insight') IS NOT NULL THEN
    DELETE FROM public.insight WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.recommendation') IS NOT NULL THEN
    DELETE FROM public.recommendation WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.message_history') IS NOT NULL THEN
    DELETE FROM public.message_history WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.wearable_sync') IS NOT NULL THEN
    DELETE FROM public.wearable_sync WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.checkin') IS NOT NULL THEN
    DELETE FROM public.checkin WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.user_supplement') IS NOT NULL THEN
    DELETE FROM public.user_supplement WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.user_baselines') IS NOT NULL THEN
    DELETE FROM public.user_baselines WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.checkins') IS NOT NULL THEN
    DELETE FROM public.checkins WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.experiments') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'experiments' AND column_name = 'user_id'
    ) THEN
      EXECUTE $ex$
        DELETE FROM public.experiments
        WHERE user_id IN (SELECT id FROM _cleanup_auth_ids)
           OR user_id IN (SELECT id FROM _cleanup_profile_ids)
      $ex$;
    END IF;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'experiments' AND column_name = 'profile_id'
    ) THEN
      EXECUTE $ex$
        DELETE FROM public.experiments
        WHERE profile_id IN (SELECT id FROM _cleanup_profile_ids)
      $ex$;
    END IF;
  END IF;

  IF to_regclass('public.cohort_participant_results') IS NOT NULL THEN
    DELETE FROM public.cohort_participant_results WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.cohort_shipping_nurture_sent') IS NOT NULL AND to_regclass('public.cohort_participants') IS NOT NULL THEN
    DELETE FROM public.cohort_shipping_nurture_sent
    WHERE cohort_participant_id IN (
      SELECT cp.id
      FROM public.cohort_participants cp
      WHERE cp.user_id IN (SELECT id FROM _cleanup_profile_ids)
         OR cp.user_id IN (SELECT id FROM _cleanup_auth_ids)
    );
  END IF;

  IF to_regclass('public.cohort_reward_claims') IS NOT NULL THEN
    IF to_regclass('public.cohort_participants') IS NOT NULL THEN
      DELETE FROM public.cohort_reward_claims
      WHERE cohort_participant_id IN (
        SELECT cp.id
        FROM public.cohort_participants cp
        WHERE cp.user_id IN (SELECT id FROM _cleanup_profile_ids)
           OR cp.user_id IN (SELECT id FROM _cleanup_auth_ids)
      );
    END IF;
    DELETE FROM public.cohort_reward_claims WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.cohort_participants') IS NOT NULL THEN
    DELETE FROM public.cohort_participants
    WHERE user_id IN (SELECT id FROM _cleanup_profile_ids)
       OR user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.onboarding_events') IS NOT NULL THEN
    DELETE FROM public.onboarding_events WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.email_sends') IS NOT NULL THEN
    DELETE FROM public.email_sends WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.daily_email_sends') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'daily_email_sends' AND column_name = 'user_id'
    ) THEN
      DELETE FROM public.daily_email_sends WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
    END IF;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'daily_email_sends' AND column_name = 'profile_id'
    ) THEN
      DELETE FROM public.daily_email_sends WHERE profile_id IN (SELECT id FROM _cleanup_profile_ids);
    END IF;
  END IF;

  IF to_regclass('public.push_subscriptions') IS NOT NULL THEN
    DELETE FROM public.push_subscriptions WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.user_tag_metadata') IS NOT NULL THEN
    DELETE FROM public.user_tag_metadata WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.daily_entries') IS NOT NULL THEN
    DELETE FROM public.daily_entries WHERE user_id IN (SELECT uid FROM _cleanup_all_uuids);
  END IF;

  IF to_regclass('public.dashboard_cache') IS NOT NULL THEN
    DELETE FROM public.dashboard_cache WHERE user_id IN (SELECT uid FROM _cleanup_all_uuids);
  END IF;

  IF to_regclass('public.user_historical_data') IS NOT NULL THEN
    DELETE FROM public.user_historical_data WHERE user_id IN (SELECT uid FROM _cleanup_all_uuids);
  END IF;

  IF to_regclass('public.mood_entries') IS NOT NULL THEN
    DELETE FROM public.mood_entries WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.elli_messages') IS NOT NULL THEN
    DELETE FROM public.elli_messages WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.elli_api_calls') IS NOT NULL THEN
    DELETE FROM public.elli_api_calls WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.magic_checkin_tokens') IS NOT NULL THEN
    DELETE FROM public.magic_checkin_tokens WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'magic_checkin_tokens' AND column_name = 'profile_id'
    ) THEN
      DELETE FROM public.magic_checkin_tokens WHERE profile_id IN (SELECT id FROM _cleanup_profile_ids);
    END IF;
  END IF;

  IF to_regclass('public.supplement_logs') IS NOT NULL THEN
    DELETE FROM public.supplement_logs WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.user_insight_preferences') IS NOT NULL THEN
    DELETE FROM public.user_insight_preferences WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.stack_change_log') IS NOT NULL THEN
    DELETE FROM public.stack_change_log WHERE owner_user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.promo_redemptions') IS NOT NULL THEN
    DELETE FROM public.promo_redemptions WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.contact_submissions') IS NOT NULL THEN
    DELETE FROM public.contact_submissions WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.email_log') IS NOT NULL THEN
    DELETE FROM public.email_log WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.email_prefs') IS NOT NULL THEN
    DELETE FROM public.email_prefs WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.user_subscriptions') IS NOT NULL THEN
    DELETE FROM public.user_subscriptions WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.user_usage') IS NOT NULL THEN
    DELETE FROM public.user_usage WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.notification_queue') IS NOT NULL THEN
    DELETE FROM public.notification_queue WHERE profile_id IN (SELECT id FROM _cleanup_profile_ids);
  END IF;

  IF to_regclass('public.notification_preferences') IS NOT NULL THEN
    DELETE FROM public.notification_preferences WHERE profile_id IN (SELECT id FROM _cleanup_profile_ids);
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notification_preferences' AND column_name = 'user_id'
    ) THEN
      DELETE FROM public.notification_preferences WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
    END IF;
  END IF;

  IF to_regclass('public.stack_followers') IS NOT NULL THEN
    DELETE FROM public.stack_followers WHERE owner_user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.beta_users') IS NOT NULL THEN
    DELETE FROM public.beta_users WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.intervention_periods') IS NOT NULL AND to_regclass('public.stack_items') IS NOT NULL THEN
    DELETE FROM public.intervention_periods
    WHERE intervention_id IN (SELECT id FROM public.stack_items WHERE profile_id IN (SELECT id FROM _cleanup_profile_ids));
  END IF;

  IF to_regclass('public.stack_items') IS NOT NULL THEN
    DELETE FROM public.stack_items WHERE profile_id IN (SELECT id FROM _cleanup_profile_ids);
  END IF;

  IF to_regclass('public.protocols') IS NOT NULL THEN
    DELETE FROM public.protocols WHERE profile_id IN (SELECT id FROM _cleanup_profile_ids);
  END IF;

  IF to_regclass('public.uploads') IS NOT NULL THEN
    DELETE FROM public.uploads WHERE profile_id IN (SELECT id FROM _cleanup_profile_ids);
  END IF;

  IF to_regclass('public.gear') IS NOT NULL THEN
    DELETE FROM public.gear WHERE profile_id IN (SELECT id FROM _cleanup_profile_ids);
  END IF;

  IF to_regclass('public.library_items') IS NOT NULL THEN
    DELETE FROM public.library_items WHERE profile_id IN (SELECT id FROM _cleanup_profile_ids);
  END IF;

  IF to_regclass('public.library') IS NOT NULL THEN
    DELETE FROM public.library WHERE profile_id IN (SELECT id FROM _cleanup_profile_ids);
  END IF;

  IF to_regclass('public.journal_entries') IS NOT NULL THEN
    DELETE FROM public.journal_entries WHERE profile_id IN (SELECT id FROM _cleanup_profile_ids);
  END IF;

  IF to_regclass('public.shop_gear_items') IS NOT NULL THEN
    DELETE FROM public.shop_gear_items WHERE profile_id IN (SELECT id FROM _cleanup_profile_ids);
  END IF;

  IF to_regclass('public.daily_updates') IS NOT NULL THEN
    DELETE FROM public.daily_updates WHERE profile_id IN (SELECT id FROM _cleanup_profile_ids);
  END IF;

  IF to_regclass('public.daily_update_shares') IS NOT NULL THEN
    DELETE FROM public.daily_update_shares WHERE profile_id IN (SELECT id FROM _cleanup_profile_ids);
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL THEN
    DELETE FROM public.profiles WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.app_user') IS NOT NULL THEN
    DELETE FROM public.app_user WHERE id IN (SELECT id FROM _cleanup_auth_ids);
  END IF;

  IF to_regclass('public.avatars') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'avatars' AND column_name = 'owner'
    ) THEN
      DELETE FROM public.avatars WHERE owner IN (SELECT id FROM _cleanup_auth_ids);
    END IF;
  END IF;
END $$;

DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);

DELETE FROM auth.users WHERE id IN (SELECT id FROM _cleanup_auth_ids);

-- ============================================================================
-- VERIFICATION — must all be zero rows / counts
-- ============================================================================
SELECT 'verify.auth.users_remaining' AS check_name, count(*)::bigint AS n
FROM auth.users
WHERE
  email LIKE '%invalidate.test%'
  OR email LIKE 'launch-seed%'
  OR email LIKE 'findbenhere+flow%'
  OR email LIKE 'findbenhere+mika%'
  OR email LIKE 'findbenhere+mario%'
  OR email LIKE 'findbenhere+sia%'
  OR email LIKE 'findbenhere+gate%'
  OR email LIKE 'findbenhere+skippy%'
  OR email LIKE 'cohortfin%'
  OR email LIKE 'cohort2%'
  OR email LIKE 'cohortpt2%'
  OR email LIKE 'captest%'
  OR email LIKE 'ben09%'
  OR email LIKE 'ben0%@mac.com'
  OR email LIKE 'tittis%'
  OR email LIKE 'iodood%'
  OR email LIKE 'zoe538%'
  OR email LIKE 'leerobson%';

SELECT 'verify.profiles_join_auth_remaining' AS check_name, count(*)::bigint AS n
FROM public.profiles p
INNER JOIN auth.users u ON u.id = p.user_id
WHERE
  u.email LIKE '%invalidate.test%'
  OR u.email LIKE 'launch-seed%'
  OR u.email LIKE 'findbenhere+flow%'
  OR u.email LIKE 'findbenhere+mika%'
  OR u.email LIKE 'findbenhere+mario%'
  OR u.email LIKE 'findbenhere+sia%'
  OR u.email LIKE 'findbenhere+gate%'
  OR u.email LIKE 'findbenhere+skippy%'
  OR u.email LIKE 'cohortfin%'
  OR u.email LIKE 'cohort2%'
  OR u.email LIKE 'cohortpt2%'
  OR u.email LIKE 'captest%'
  OR u.email LIKE 'ben09%'
  OR u.email LIKE 'ben0%@mac.com'
  OR u.email LIKE 'tittis%'
  OR u.email LIKE 'iodood%'
  OR u.email LIKE 'zoe538%'
  OR u.email LIKE 'leerobson%';

COMMIT;
