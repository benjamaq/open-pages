-- Create per-user tag metadata for organizing custom tags by section
-- Run in Supabase SQL editor

create table if not exists public.user_tag_metadata (
  user_id uuid not null references auth.users(id) on delete cascade,
  tag_slug text not null,
  section text not null check (section in ('food','activity','environment','other')),
  created_at timestamptz not null default now(),
  primary key (user_id, tag_slug)
);

alter table public.user_tag_metadata enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_tag_metadata'
      and policyname = 'Users can manage their own tag metadata'
  ) then
    create policy "Users can manage their own tag metadata"
      on public.user_tag_metadata
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;


