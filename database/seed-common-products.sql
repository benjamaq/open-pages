-- Insert canonical supplements
insert into canonical_supplement (generic_name, ingredient_type, default_goal_tags, search_keywords) values
('Creatine Monohydrate', 'amino_acid', '{"athletic_performance", "cognitive"}', '{"creatine", "monohydrate"}'),
('Magnesium Glycinate', 'mineral', '{"sleep", "relaxation", "recovery"}', '{"magnesium", "mag", "glycinate", "bisglycinate"}'),
('Vitamin D3', 'vitamin', '{"immunity", "hormonal", "mood"}', '{"vitamin d", "d3", "cholecalciferol"}'),
('Omega-3 Fish Oil', 'lipid', '{"brain", "heart", "inflammation"}', '{"omega", "omega 3", "fish oil", "epa", "dha"}'),
('Ashwagandha', 'botanical', '{"stress", "sleep", "hormonal"}', '{"ashwagandha", "ksm-66", "sensoril"}'),
('Zinc', 'mineral', '{"immunity", "hormonal"}', '{"zinc", "picolinate", "citrate"}'),
('Vitamin C', 'vitamin', '{"immunity", "antioxidant"}', '{"vitamin c", "ascorbic acid"}'),
('B-Complex', 'vitamin', '{"energy", "cognitive"}', '{"b complex", "b vitamins"}'),
('Probiotics', 'other', '{"gut", "immunity"}', '{"probiotic", "lactobacillus", "bifidobacterium"}'),
('CoQ10', 'lipid', '{"energy", "heart", "longevity"}', '{"coq10", "ubiquinol", "coenzyme"}'),
('L-Theanine', 'amino_acid', '{"stress", "focus", "sleep"}', '{"theanine", "l-theanine"}'),
('Glycine', 'amino_acid', '{"sleep", "recovery"}', '{"glycine"}'),
('Melatonin', 'other', '{"sleep"}', '{"melatonin"}'),
('Curcumin', 'botanical', '{"inflammation", "gut"}', '{"curcumin", "turmeric"}'),
('Lions Mane', 'botanical', '{"cognitive", "focus"}', '{"lions mane", "mushroom"}')
on conflict (generic_name) do nothing;

-- Creatine products
insert into product (brand_name, product_name, canonical_supplement_id, servings_per_container, dose_per_serving_amount, dose_per_serving_unit, currency, price_per_container, source, product_url) values
('Thorne Research', 'Creatine - 90 Capsules', (select id from canonical_supplement where generic_name = 'Creatine Monohydrate'), 90, 1, 'capsules', 'USD', 28.00, 'iherb', 'https://www.iherb.com/pr/thorne-research-creatine-90-capsules/70354'),
('NOW Foods', 'Creatine Monohydrate Powder - 227g', (select id from canonical_supplement where generic_name = 'Creatine Monohydrate'), 45, 5, 'grams', 'USD', 19.99, 'iherb', 'https://www.iherb.com/pr/now-foods-sports-creatine-monohydrate-pure-powder-8-oz-227-g/766'),
('Optimum Nutrition', 'Micronized Creatine - 600g', (select id from canonical_supplement where generic_name = 'Creatine Monohydrate'), 120, 5, 'grams', 'USD', 24.99, 'iherb', 'https://www.iherb.com/pr/optimum-nutrition-micronized-creatine-powder-unflavored-21-2-oz-600-g/27511');

-- Magnesium products
insert into product (brand_name, product_name, canonical_supplement_id, servings_per_container, dose_per_serving_amount, dose_per_serving_unit, currency, price_per_container, source, product_url) values
('Thorne Research', 'Magnesium Bisglycinate - 120 Capsules', (select id from canonical_supplement where generic_name = 'Magnesium Glycinate'), 120, 2, 'capsules', 'USD', 28.50, 'iherb', 'https://www.iherb.com/pr/thorne-research-magnesium-bisglycinate-120-capsules/17642'),
('Doctors Best', 'High Absorption Magnesium - 120 Tablets', (select id from canonical_supplement where generic_name = 'Magnesium Glycinate'), 120, 2, 'tablets', 'USD', 14.99, 'iherb', 'https://www.iherb.com/pr/doctor-s-best-high-absorption-magnesium-100-chelated-120-tablets/16567'),
('NOW Foods', 'Magnesium Glycinate - 180 Tablets', (select id from canonical_supplement where generic_name = 'Magnesium Glycinate'), 180, 2, 'tablets', 'USD', 16.99, 'iherb', 'https://www.iherb.com/pr/now-foods-magnesium-glycinate-180-tablets/69504');

-- Vitamin D3 products
insert into product (brand_name, product_name, canonical_supplement_id, servings_per_container, dose_per_serving_amount, dose_per_serving_unit, currency, price_per_container, source, product_url) values
('Thorne Research', 'Vitamin D3 5000 IU - 90 Capsules', (select id from canonical_supplement where generic_name = 'Vitamin D3'), 90, 1, 'capsules', 'USD', 24.00, 'iherb', 'https://www.iherb.com/pr/thorne-research-vitamin-d-3-5-000-iu-90-capsules/70353'),
('NOW Foods', 'Vitamin D3 5000 IU - 240 Softgels', (select id from canonical_supplement where generic_name = 'Vitamin D3'), 240, 1, 'softgels', 'USD', 12.99, 'iherb', 'https://www.iherb.com/pr/now-foods-vitamin-d-3-5-000-iu-240-softgels/38175'),
('Life Extension', 'Vitamin D3 5000 IU - 60 Softgels', (select id from canonical_supplement where generic_name = 'Vitamin D3'), 60, 1, 'softgels', 'USD', 9.00, 'iherb', 'https://www.iherb.com/pr/life-extension-vitamin-d3-5-000-iu-60-softgels/70161');

-- Omega-3 products
insert into product (brand_name, product_name, canonical_supplement_id, servings_per_container, dose_per_serving_amount, dose_per_serving_unit, currency, price_per_container, source, product_url) values
('Nordic Naturals', 'Ultimate Omega - 120 Softgels', (select id from canonical_supplement where generic_name = 'Omega-3 Fish Oil'), 120, 2, 'softgels', 'USD', 49.95, 'iherb', 'https://www.iherb.com/pr/nordic-naturals-ultimate-omega-lemon-1-000-mg-120-soft-gels/4650'),
('NOW Foods', 'Omega-3 - 200 Softgels', (select id from canonical_supplement where generic_name = 'Omega-3 Fish Oil'), 200, 2, 'softgels', 'USD', 21.99, 'iherb', 'https://www.iherb.com/pr/now-foods-omega-3-180-epa-120-dha-200-softgels/533'),
('Life Extension', 'Super Omega-3 - 120 Softgels', (select id from canonical_supplement where generic_name = 'Omega-3 Fish Oil'), 120, 2, 'softgels', 'USD', 28.00, 'iherb', 'https://www.iherb.com/pr/life-extension-super-omega-3-epa-dha-with-sesame-lignans-olive-extract-120-softgels/70151');

-- Ashwagandha products
insert into product (brand_name, product_name, canonical_supplement_id, servings_per_container, dose_per_serving_amount, dose_per_serving_unit, currency, price_per_container, source, product_url) values
('Thorne Research', 'Ashwagandha - 60 Capsules', (select id from canonical_supplement where generic_name = 'Ashwagandha'), 60, 1, 'capsules', 'USD', 25.00, 'iherb', 'https://www.iherb.com/pr/thorne-research-ashwagandha-60-capsules/107273'),
('NOW Foods', 'Ashwagandha 450mg - 90 Capsules', (select id from canonical_supplement where generic_name = 'Ashwagandha'), 90, 1, 'capsules', 'USD', 12.99, 'iherb', 'https://www.iherb.com/pr/now-foods-ashwagandha-450-mg-90-veg-capsules/68365'),
('Jarrow Formulas', 'Ashwagandha KSM-66 - 120 Capsules', (select id from canonical_supplement where generic_name = 'Ashwagandha'), 120, 1, 'capsules', 'USD', 18.95, 'iherb', 'https://www.iherb.com/pr/jarrow-formulas-ashwagandha-ksm-66-300-mg-120-veggie-caps/66925');

-- Zinc products
insert into product (brand_name, product_name, canonical_supplement_id, servings_per_container, dose_per_serving_amount, dose_per_serving_unit, currency, price_per_container, source, product_url) values
('Thorne Research', 'Zinc Picolinate 30mg - 60 Capsules', (select id from canonical_supplement where generic_name = 'Zinc'), 60, 1, 'capsules', 'USD', 15.00, 'iherb', 'https://www.iherb.com/pr/thorne-research-zinc-picolinate-30-mg-60-capsules/17644'),
('NOW Foods', 'Zinc Glycinate 30mg - 120 Softgels', (select id from canonical_supplement where generic_name = 'Zinc'), 120, 1, 'softgels', 'USD', 9.99, 'iherb', 'https://www.iherb.com/pr/now-foods-zinc-glycinate-30-mg-120-softgels/74532');

-- Additional products
insert into product (brand_name, product_name, canonical_supplement_id, servings_per_container, dose_per_serving_amount, dose_per_serving_unit, currency, price_per_container, source, product_url) values
('NOW Foods', 'Vitamin C 1000mg - 250 Tablets', (select id from canonical_supplement where generic_name = 'Vitamin C'), 250, 1, 'tablets', 'USD', 14.99, 'iherb', 'https://www.iherb.com/pr/now-foods-vitamin-c-1-000-mg-250-tablets/824'),
('Thorne Research', 'B-Complex #12 - 60 Capsules', (select id from canonical_supplement where generic_name = 'B-Complex'), 60, 1, 'capsules', 'USD', 22.00, 'iherb', 'https://www.iherb.com/pr/thorne-research-b-complex-12-60-capsules/17636'),
('Garden of Life', 'Dr. Formulated Probiotics - 30 Capsules', (select id from canonical_supplement where generic_name = 'Probiotics'), 30, 1, 'capsules', 'USD', 34.99, 'iherb', 'https://www.iherb.com/pr/garden-of-life-dr-formulated-probiotics-once-daily-30-billion-cfu-30-veggie-caps/63898'),
('Jarrow Formulas', 'QH-absorb CoQ10 100mg - 120 Softgels', (select id from canonical_supplement where generic_name = 'CoQ10'), 120, 1, 'softgels', 'USD', 42.99, 'iherb', 'https://www.iherb.com/pr/jarrow-formulas-qh-absorb-100-mg-120-softgels/11764'),
('NOW Foods', 'L-Theanine 200mg - 120 Capsules', (select id from canonical_supplement where generic_name = 'L-Theanine'), 120, 1, 'capsules', 'USD', 21.99, 'iherb', 'https://www.iherb.com/pr/now-foods-l-theanine-200-mg-120-veg-capsules/12017'),
('NOW Foods', 'Glycine 1000mg - 100 Capsules', (select id from canonical_supplement where generic_name = 'Glycine'), 100, 1, 'capsules', 'USD', 8.99, 'iherb', 'https://www.iherb.com/pr/now-foods-glycine-1-000-mg-100-veg-capsules/737'),
('NOW Foods', 'Melatonin 3mg - 180 Capsules', (select id from canonical_supplement where generic_name = 'Melatonin'), 180, 1, 'capsules', 'USD', 9.99, 'iherb', 'https://www.iherb.com/pr/now-foods-melatonin-3-mg-180-capsules/603'),
('Thorne Research', 'Meriva 500-SF - 120 Capsules', (select id from canonical_supplement where generic_name = 'Curcumin'), 120, 1, 'capsules', 'USD', 58.00, 'iherb', 'https://www.iherb.com/pr/thorne-research-meriva-500-sf-120-capsules/17652'),
('Host Defense', 'Lions Mane - 120 Capsules', (select id from canonical_supplement where generic_name = 'Lions Mane'), 120, 2, 'capsules', 'USD', 49.99, 'iherb', 'https://www.iherb.com/pr/host-defense-lion-s-mane-120-veggie-caps/70823');


