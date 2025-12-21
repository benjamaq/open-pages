-- Currency schema: user prefs, per-row currency, and exchange rates

-- User preferred currency and auto-convert setting
alter table app_user
  add column if not exists preferred_currency text default 'USD',
  add column if not exists auto_convert boolean default true;

-- Track currency on user_supplement rows (original currency of monthly_cost_usd)
alter table user_supplement
  add column if not exists cost_currency text default 'USD';

-- Exchange rates table for conversions (base USD or mixed)
create table if not exists exchange_rate (
  id uuid primary key default gen_random_uuid(),
  from_currency text not null,
  to_currency text not null,
  rate numeric not null,
  updated_at timestamptz not null default now(),
  unique(from_currency, to_currency)
);

create index if not exists exchange_rate_lookup_idx
  on exchange_rate(from_currency, to_currency);

-- Seed USD→USD rate for safety
insert into exchange_rate (from_currency, to_currency, rate)
values ('USD','USD',1)
on conflict (from_currency, to_currency) do update set rate = excluded.rate;


