-- Study landing hero: "worth over {headline}" — SureSleep product supply + 3 months BioStackr Pro (~$200 combined).
-- Merges into existing JSON so other keys are never dropped.

UPDATE public.cohorts
SET study_landing_reward_config =
  COALESCE(study_landing_reward_config, '{}'::jsonb)
  || jsonb_build_object(
    'package_value',
    COALESCE(study_landing_reward_config->'package_value', '{}'::jsonb)
      || jsonb_build_object(
        'headline',
        '$200',
        'subline',
        'Combined participant reward value when you complete all study days (full SureSleep study supply plus 3 months of BioStackr Pro).'
      )
  )
WHERE slug = 'donotage-suresleep';
