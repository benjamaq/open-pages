-- Allow authenticated users to insert new canonical supplements
alter table supplement enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'supplement' and policyname = 'Users can insert supplements'
  ) then
    create policy "Users can insert supplements" on supplement
      for insert
      with check (true);
  end if;
end $$;

-- Keep public read policy (idempotent definition is elsewhere, but ensure present)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'supplement' and policyname = 'Anyone can view supplements'
  ) then
    create policy "Anyone can view supplements" on supplement
      for select using (true);
  end if;
end $$;


