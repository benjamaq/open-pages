-- Captures email when an applicant cannot pass free-text qualification (no auth account).
create table if not exists public.study_waitlist (
  id uuid primary key default gen_random_uuid (),
  cohort_id uuid not null references public.cohorts (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now (),
  constraint study_waitlist_email_nonempty check (char_length(trim(both from email)) > 0)
);

create unique index if not exists study_waitlist_cohort_email_lower_unique on public.study_waitlist (
  cohort_id,
  lower(trim(both from email))
);

create index if not exists study_waitlist_cohort_id_idx on public.study_waitlist (cohort_id);

alter table public.study_waitlist enable row level security;
