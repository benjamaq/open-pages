-- Product Hunt promo code system (PH30)
-- - Adds profiles.pro_expires_at
-- - Adds promo_codes + promo_redemptions tables
-- - Adds transactional redeem_promo_code() RPC
-- - Seeds PH30

create extension if not exists pgcrypto;

alter table if exists public.profiles
add column if not exists pro_expires_at timestamptz default null;

create table if not exists public.promo_codes (
  code text primary key,
  max_redemptions int not null,
  current_redemptions int not null default 0,
  grants_days int not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  redeemed_at timestamptz not null default now(),
  constraint promo_redemptions_user_code_unique unique (user_id, code)
);

create index if not exists idx_promo_redemptions_code on public.promo_redemptions(code);
create index if not exists idx_promo_redemptions_user on public.promo_redemptions(user_id);

-- Atomic redemption in a single transaction (prevents double-redemption and max-cap races).
create or replace function public.redeem_promo_code(p_code text, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_row public.promo_codes%rowtype;
  v_now timestamptz := now();
  v_new_expiry timestamptz;
begin
  v_code := upper(trim(coalesce(p_code, '')));
  if v_code = '' then
    raise exception 'Code not found';
  end if;

  select *
    into v_row
    from public.promo_codes
   where code = v_code
   for update;

  if not found then
    raise exception 'Code not found';
  end if;

  if v_row.expires_at <= v_now then
    raise exception 'Code expired';
  end if;

  if v_row.current_redemptions >= v_row.max_redemptions then
    raise exception 'No redemptions left';
  end if;

  if exists (
    select 1 from public.promo_redemptions
     where user_id = p_user_id
       and code = v_code
  ) then
    raise exception 'Already redeemed';
  end if;

  insert into public.promo_redemptions (user_id, code)
  values (p_user_id, v_code);

  update public.promo_codes
     set current_redemptions = current_redemptions + 1
   where code = v_code;

  -- Grant Pro for grants_days; if user already has an expiry in the future, extend from that date.
  update public.profiles
     set tier = 'pro',
         pro_expires_at = greatest(coalesce(pro_expires_at, v_now), v_now) + make_interval(days => v_row.grants_days)
   where user_id = p_user_id
   returning pro_expires_at into v_new_expiry;

  return jsonb_build_object(
    'ok', true,
    'code', v_code,
    'grants_days', v_row.grants_days,
    'pro_expires_at', v_new_expiry
  );
end;
$$;

-- Seed the Product Hunt launch code.
insert into public.promo_codes (code, max_redemptions, grants_days, expires_at)
values ('PH30', 200, 30, '2026-02-27T00:00:00Z')
on conflict (code) do update
  set max_redemptions = excluded.max_redemptions,
      grants_days = excluded.grants_days,
      expires_at = excluded.expires_at;


