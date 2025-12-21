-- Canonical supplements (ingredient-level definitions)
create table if not exists canonical_supplement (
  id uuid primary key default gen_random_uuid(),
  generic_name text not null unique,
  ingredient_type text not null,
  -- Options: amino_acid, mineral, vitamin, botanical, lipid, peptide, blend, other
  default_goal_tags text[] default '{}',
  search_keywords text[] default '{}',
  created_at timestamptz default now()
);

-- Products (from iHerb, manual entry)
create table if not exists product (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null,
  product_name text not null,
  canonical_supplement_id uuid references canonical_supplement(id),
  servings_per_container integer not null,
  dose_per_serving_amount numeric not null,
  dose_per_serving_unit text not null,
  currency text not null default 'USD',
  price_per_container numeric not null,
  source text not null, -- 'iherb' | 'manual'
  product_url text,
  iherb_product_id text,
  image_url text,
  last_price_update timestamptz default now(),
  created_at timestamptz default now()
);

-- Indexes for fast search
create index if not exists product_name_search_idx 
  on product using gin(to_tsvector('english', product_name));
create index if not exists brand_name_search_idx 
  on product using gin(to_tsvector('english', brand_name));

-- Update user_supplement to link products
alter table user_supplement 
  add column if not exists product_id uuid references product(id),
  add column if not exists days_per_week integer default 7;

-- RLS policies
alter table canonical_supplement enable row level security;
alter table product enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='canonical_supplement' and policyname='Anyone can view canonical supplements') then
    create policy "Anyone can view canonical supplements" on canonical_supplement
      for select using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='product' and policyname='Anyone can view products') then
    create policy "Anyone can view products" on product
      for select using (true);
  end if;
end $$;


