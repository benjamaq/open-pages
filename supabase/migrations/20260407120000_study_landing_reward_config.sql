-- Public /study/[slug] incentive copy: partner completion reward is product supply vs store credit (not slug-hardcoded in app).

ALTER TABLE public.cohorts
  ADD COLUMN IF NOT EXISTS study_landing_reward_config jsonb NULL;

COMMENT ON COLUMN public.cohorts.study_landing_reward_config IS
  'Optional JSON for study landing "You''ll receive" section: completion_partner_reward_type (product_supply|store_credit), partner_store_credit {title,description,visual_path}, summary_lines[], package_value {headline,subline}.';

-- Seeking Health Optimal Focus: completion reward is store credit, not product supply.
UPDATE public.cohorts
SET study_landing_reward_config = jsonb_build_object(
  'completion_partner_reward_type', 'store_credit',
  'partner_store_credit', jsonb_build_object(
    'title', '$120 store credit',
    'description', 'Receive $120 in store credit from Seeking Health when you complete the full study.',
    'visual_path', '/cohorts/seeking-health/hero.png'
  ),
  'summary_lines', jsonb_build_array(
    '$120 Seeking Health store credit',
    '3 months of BioStackr Pro'
  ),
  'package_value', jsonb_build_object(
    'headline', '$200+',
    'subline', 'Combined participant reward value when you complete all study days.'
  )
)
WHERE slug = 'seeking-health-optimal-focus';
