BEGIN;

CREATE TEMP TABLE _cleanup_auth_ids ON COMMIT DROP AS
SELECT id
FROM auth.users
WHERE
  email ILIKE '%+test%@gmail.com'
  OR email LIKE 'loadtest+%@biostackr.io'
  OR email LIKE 'cohort-isolation+%@biostackr.io';

CREATE TEMP TABLE _cleanup_profile_ids ON COMMIT DROP AS
SELECT id
FROM public.profiles
WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);

CREATE TEMP TABLE _cleanup_all_uuids ON COMMIT DROP AS
SELECT id AS uid FROM _cleanup_auth_ids
UNION
SELECT id FROM _cleanup_profile_ids;

DO $$
BEGIN
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
    DELETE FROM public.experiments WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
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
    DELETE FROM public.daily_email_sends WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);
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
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'magic_checkin_tokens'
        AND column_name = 'profile_id'
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
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'notification_preferences'
        AND column_name = 'user_id'
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
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'avatars'
        AND column_name = 'owner'
    ) THEN
      DELETE FROM public.avatars WHERE owner IN (SELECT id FROM _cleanup_auth_ids);
    END IF;
  END IF;
END $$;

DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM _cleanup_auth_ids);

DELETE FROM auth.users WHERE id IN (SELECT id FROM _cleanup_auth_ids);

COMMIT;
