-- Seed 50 common supplement profiles
-- Categories: 'performance' (feel it) | 'protective' (long-term) | 'synergistic' (works with others)

INSERT INTO supplement_profiles (
  name, 
  category, 
  expected_window_days, 
  loading_phase_days, 
  peak_effect_days, 
  builds_tolerance, 
  tolerance_days,
  primary_metrics, 
  literature_effect, 
  literature_confidence, 
  notes
) VALUES

-- PERFORMANCE SUPPLEMENTS (feel the effect quickly)
('Magnesium', 'performance', 14, null, 7, false, null, ARRAY['sleep', 'hrv', 'mood'], 'positive', 0.85, 'Supports sleep quality and muscle relaxation. Most people are deficient.'),
('Magnesium Glycinate', 'performance', 14, null, 7, false, null, ARRAY['sleep', 'relaxation'], 'positive', 0.87, 'Most bioavailable form for sleep and relaxation'),
('Creatine', 'performance', 21, 7, 14, false, null, ARRAY['recovery', 'strength', 'cognition'], 'positive', 0.90, 'Loads in muscles over 7 days. Peak effect at day 14. Also supports brain function.'),
('L-Theanine', 'performance', 7, null, 1, false, null, ARRAY['mood', 'focus', 'anxiety'], 'positive', 0.75, 'Fast-acting calm focus. Works synergistically with caffeine.'),
('Ashwagandha', 'performance', 30, null, 14, false, null, ARRAY['stress', 'hrv', 'mood', 'cortisol'], 'positive', 0.80, 'Adaptogen that reduces cortisol and stress markers. Takes 2 weeks to show full effect.'),
('Caffeine', 'performance', 7, null, 1, true, 14, ARRAY['energy', 'focus', 'performance'], 'positive', 0.95, 'Immediate effect. Tolerance builds in 14 days. Consider cycling.'),
('Rhodiola', 'performance', 14, null, 7, false, null, ARRAY['energy', 'stress', 'fatigue'], 'positive', 0.70, 'Adaptogen for fatigue and mental stress. Works best under load.'),
('L-Citrulline', 'performance', 14, null, 7, false, null, ARRAY['recovery', 'performance', 'blood_flow'], 'positive', 0.75, 'Improves blood flow and recovery. Pre-workout staple.'),
('Glycine', 'performance', 7, null, 3, false, null, ARRAY['sleep', 'recovery'], 'positive', 0.75, 'Improves sleep quality. Take 3g before bed.'),
('Taurine', 'performance', 14, null, 7, false, null, ARRAY['energy', 'recovery', 'cardiovascular'], 'positive', 0.70, 'Supports cardiovascular function and mental performance.'),

-- PROTECTIVE SUPPLEMENTS (long-term stability, minimal acute effects)
('Fish Oil (Omega-3)', 'protective', 90, null, 60, false, null, ARRAY['hrv_stability', 'rhr', 'inflammation'], 'protective', 0.85, 'Anti-inflammatory and cardiovascular protection. Takes 60-90 days. Look for EPA/DHA content.'),
('Vitamin D', 'protective', 90, null, 60, false, null, ARRAY['immune', 'mood', 'bone'], 'protective', 0.90, 'Critical in winter. Dose 2000-4000 IU. Check blood levels.'),
('Vitamin D3', 'protective', 90, null, 60, false, null, ARRAY['immune', 'mood', 'bone'], 'protective', 0.92, 'Active form. Take with K2 for best absorption.'),
('Vitamin C', 'protective', 60, null, null, false, null, ARRAY['immune', 'antioxidant'], 'protective', 0.70, 'Immune support. Minimal acute effects. Dose 500-1000mg.'),
('Coenzyme Q10 (CoQ10)', 'protective', 90, null, 60, false, null, ARRAY['energy', 'cardiovascular', 'mitochondria'], 'protective', 0.75, 'Mitochondrial support. Important if taking statins.'),
('NAC (N-Acetyl Cysteine)', 'protective', 60, null, 30, false, null, ARRAY['recovery', 'immune', 'liver'], 'protective', 0.70, 'Powerful antioxidant. Liver and respiratory support.'),
('Zinc', 'protective', 60, null, 30, false, null, ARRAY['immune', 'testosterone'], 'protective', 0.75, 'Immune function and cell repair. Dose 15-30mg. Can deplete copper.'),
('Curcumin', 'protective', 60, null, 30, false, null, ARRAY['recovery', 'inflammation', 'joint'], 'protective', 0.75, 'Anti-inflammatory. Needs black pepper or lipid for absorption.'),
('Vitamin K2', 'protective', 90, null, 60, false, null, ARRAY['bone', 'cardiovascular'], 'protective', 0.72, 'Works with D3. Directs calcium to bones not arteries.'),
('Alpha Lipoic Acid', 'protective', 60, null, 30, false, null, ARRAY['antioxidant', 'glucose'], 'protective', 0.68, 'Antioxidant and glucose metabolism support.'),

-- SYNERGISTIC (work best with other supplements)
('B-Complex', 'synergistic', 30, null, 14, false, null, ARRAY['energy', 'mood', 'metabolism'], 'positive', 0.65, 'Works synergistically with other nutrients. Supports energy production.'),
('Collagen', 'synergistic', 90, null, 60, false, null, ARRAY['recovery', 'joint', 'skin'], 'protective', 0.60, 'Joint and skin support. Long-term benefits. Dose 10-20g.'),
('Electrolytes', 'synergistic', 7, null, 1, false, null, ARRAY['performance', 'recovery', 'hydration'], 'positive', 0.70, 'Critical for hydration and performance. Especially important if low-carb.'),
('Probiotics', 'protective', 60, 14, 30, false, null, ARRAY['gut', 'immune', 'mood'], 'protective', 0.70, 'Gut colonization takes 2-4 weeks. Benefits accumulate over time.'),
('Betaine', 'synergistic', 21, 7, 14, false, null, ARRAY['performance', 'strength'], 'positive', 0.65, 'Works with creatine. Supports power output.'),

-- MORE PERFORMANCE SUPPLEMENTS
('Melatonin', 'performance', 7, null, 1, true, 14, ARRAY['sleep'], 'positive', 0.80, 'Fast-acting sleep aid. Can build dependence. Start with 0.5-1mg.'),
('5-HTP', 'performance', 14, null, 7, false, null, ARRAY['mood', 'sleep', 'serotonin'], 'positive', 0.65, 'Serotonin precursor. Can improve mood and sleep. Take at night.'),
('Beta-Alanine', 'performance', 14, 7, 14, false, null, ARRAY['performance', 'endurance'], 'positive', 0.75, 'Buffers lactic acid. May cause tingling (harmless). Loading phase helpful.'),
('Alpha-GPC', 'performance', 14, null, 7, false, null, ARRAY['focus', 'memory', 'power'], 'positive', 0.65, 'Cholinergic cognitive enhancer. Supports mind-muscle connection.'),
('Bacopa Monnieri', 'performance', 60, null, 45, false, null, ARRAY['memory', 'focus', 'anxiety'], 'positive', 0.70, 'Slow-acting nootropic. Requires patience. Full benefits at 6-12 weeks.'),
('Lions Mane', 'protective', 60, null, 45, false, null, ARRAY['cognition', 'nerve', 'memory'], 'protective', 0.65, 'Nerve growth factor support. Long-term cognitive protection.'),
('Mucuna Pruriens', 'performance', 14, null, 7, false, null, ARRAY['mood', 'motivation', 'dopamine'], 'positive', 0.62, 'L-DOPA source. Supports dopamine. Can build tolerance.'),
('Cordyceps', 'performance', 21, null, 14, false, null, ARRAY['energy', 'endurance', 'recovery'], 'positive', 0.68, 'Adaptogenic mushroom. Supports ATP and oxygen utilization.'),

-- MORE PROTECTIVE SUPPLEMENTS
('Resveratrol', 'protective', 90, null, 60, false, null, ARRAY['longevity', 'cardiovascular'], 'protective', 0.60, 'Polyphenol with potential longevity benefits. Jury still out on humans.'),
('Quercetin', 'protective', 60, null, 30, false, null, ARRAY['immune', 'inflammation', 'antioxidant'], 'protective', 0.65, 'Flavonoid with immune and anti-inflammatory properties.'),
('Berberine', 'protective', 60, null, 30, false, null, ARRAY['glucose', 'metabolism'], 'protective', 0.72, 'Blood sugar regulation. Take with meals.'),
('Spirulina', 'protective', 60, null, 30, false, null, ARRAY['immune', 'protein', 'antioxidant'], 'protective', 0.58, 'Nutrient-dense algae. Complete protein source.'),
('Glutathione', 'protective', 60, null, 30, false, null, ARRAY['antioxidant', 'liver', 'detox'], 'protective', 0.62, 'Master antioxidant. Bioavailability matters - liposomal form best.'),

-- ADDITIONAL COMMON SUPPLEMENTS
('Magnesium Threonate', 'performance', 21, null, 14, false, null, ARRAY['cognition', 'memory', 'sleep'], 'positive', 0.72, 'Only form that crosses blood-brain barrier effectively. Expensive.'),
('Nicotinamide Riboside (NR)', 'protective', 90, null, 60, false, null, ARRAY['longevity', 'energy', 'nad'], 'protective', 0.58, 'NAD+ precursor. Longevity supplement. Expensive. Evidence still emerging.'),
('PQQ', 'protective', 60, null, 30, false, null, ARRAY['mitochondria', 'cognition'], 'protective', 0.55, 'Mitochondrial biogenesis. Works with CoQ10.'),
('Phosphatidylserine', 'performance', 30, null, 21, false, null, ARRAY['cognition', 'stress', 'cortisol'], 'positive', 0.68, 'Reduces post-exercise cortisol. Supports memory.'),
('HMB', 'performance', 21, 7, 14, false, null, ARRAY['recovery', 'muscle', 'strength'], 'positive', 0.65, 'Anti-catabolic. Preserves muscle during cutting or aging.'),
('Citicoline (CDP-Choline)', 'performance', 14, null, 7, false, null, ARRAY['focus', 'memory', 'energy'], 'positive', 0.70, 'Cholinergic nootropic. Supports focus and mental energy.'),
('Tyrosine', 'performance', 7, null, 1, false, null, ARRAY['focus', 'stress', 'dopamine'], 'positive', 0.68, 'Dopamine precursor. Works under stress or sleep deprivation.'),
('GABA', 'performance', 7, null, 1, false, null, ARRAY['anxiety', 'sleep', 'relaxation'], 'positive', 0.55, 'Calming neurotransmitter. Poor blood-brain barrier penetration.'),
('Boron', 'protective', 60, null, 30, false, null, ARRAY['testosterone', 'bone'], 'protective', 0.62, 'Supports testosterone and bone health. Dose 3-6mg.'),
('Selenium', 'protective', 60, null, 30, false, null, ARRAY['thyroid', 'immune', 'antioxidant'], 'protective', 0.70, 'Thyroid function. Antioxidant. Toxic in high doses - dont exceed 200mcg.'),
('Iodine', 'protective', 60, null, 30, false, null, ARRAY['thyroid', 'metabolism'], 'protective', 0.75, 'Essential for thyroid. Many people deficient. Use kelp or supplement.'),
('Vitamin E', 'protective', 90, null, 60, false, null, ARRAY['antioxidant', 'cardiovascular'], 'protective', 0.60, 'Fat-soluble antioxidant. Get mixed tocopherols not just alpha.'),
('Folate (Methylfolate)', 'protective', 60, null, 30, false, null, ARRAY['mood', 'cardiovascular', 'methylation'], 'protective', 0.72, 'Better than folic acid for those with MTHFR mutations.'),
('B12 (Methylcobalamin)', 'protective', 60, null, 30, false, null, ARRAY['energy', 'nerve', 'methylation'], 'protective', 0.78, 'Critical for vegans. Sublingual or injection best. Methyl form preferred.')

ON CONFLICT (name) DO NOTHING;


