create table if not exists experiments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  supplement_id uuid not null,
  name text,
  start_date date not null,
  end_date date,
  target_days int not null default 7,
  effect_pct int,
  confidence int,
  verdict text check (verdict in ('keep','drop','needs_data')),
  created_at timestamptz default now()
);

create or replace view experiments_active as
  select * from experiments where end_date is null;


