-- Extend user_supplement for onboarding product linkage and metadata
alter table user_supplement
  add column if not exists product_id uuid references product(id),
  add column if not exists days_per_week integer default 7,
  add column if not exists brand_name text,
  add column if not exists name text,
  add column if not exists daily_dose_amount numeric,
  add column if not exists daily_dose_unit text,
  add column if not exists primary_goal_tags text[] default '{}';

-- Helpful index for product lookups
create index if not exists user_supplement_product_idx on user_supplement(product_id);


