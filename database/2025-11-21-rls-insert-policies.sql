-- Add explicit INSERT WITH CHECK policies for write operations

-- checkin
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='checkin' and policyname='checkin_insert_own') then
    create policy checkin_insert_own on checkin
      for insert
      with check (auth.uid() = user_id);
  end if;
end$$;

-- user_supplement
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_supplement' and policyname='user_supplement_insert_own') then
    create policy user_supplement_insert_own on user_supplement
      for insert
      with check (auth.uid() = user_id);
  end if;
end$$;

-- validation_test
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='validation_test' and policyname='validation_test_insert_own') then
    create policy validation_test_insert_own on validation_test
      for insert
      with check (auth.uid() = user_id);
  end if;
end$$;

-- recommendation (optional writes)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='recommendation' and policyname='recommendation_insert_own') then
    create policy recommendation_insert_own on recommendation
      for insert
      with check (auth.uid() = user_id);
  end if;
end$$;






