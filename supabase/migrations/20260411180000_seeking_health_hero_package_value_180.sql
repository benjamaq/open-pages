-- Hero: "worth over {headline}" — $120 Seeking Health store credit +3 months BioStackr Pro (~$60).
-- Merges into existing JSON so other keys are never dropped.

UPDATE public.cohorts
SET study_landing_reward_config =
  COALESCE(study_landing_reward_config, '{}'::jsonb)
  || jsonb_build_object(
    'package_value',
    COALESCE(study_landing_reward_config->'package_value', '{}'::jsonb)
      || jsonb_build_object(
        'headline',
        '$180',
        'subline',
        'Combined participant reward value when you complete all study days ($120 Seeking Health store credit plus 3 months of BioStackr Pro).'
      )
  )
WHERE slug = 'seeking-health-optimal-focus';
