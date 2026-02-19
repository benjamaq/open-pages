-- Promo redeem hardening:
-- Ensure redeem_promo_code works even if the user has no profiles row yet.

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
  insert into public.profiles (user_id, tier, pro_expires_at)
  values (p_user_id, 'pro', v_now + make_interval(days => v_row.grants_days))
  on conflict (user_id) do update
    set tier = 'pro',
        pro_expires_at = greatest(coalesce(public.profiles.pro_expires_at, v_now), v_now) + make_interval(days => v_row.grants_days)
  returning pro_expires_at into v_new_expiry;

  return jsonb_build_object(
    'ok', true,
    'code', v_code,
    'grants_days', v_row.grants_days,
    'pro_expires_at', v_new_expiry
  );
end;
$$;


