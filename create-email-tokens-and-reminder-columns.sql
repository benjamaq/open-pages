-- Create email_tokens table (if not exists)
create table if not exists public.email_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  token text unique not null,
  type text not null, -- 'quick_save'
  expires_at timestamp not null,
  used_at timestamp null,
  payload text null,
  created_at timestamp not null default now()
);

-- Helpful index on type for querying by purpose
create index if not exists email_tokens_type_idx on public.email_tokens (type);
create index if not exists email_tokens_user_idx on public.email_tokens (user_id);

-- Add last_reminder_sent_at to profiles for gating
alter table public.profiles
  add column if not exists last_reminder_sent_at timestamp null;


