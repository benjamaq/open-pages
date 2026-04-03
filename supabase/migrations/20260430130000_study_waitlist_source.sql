-- Optional tag for how the waitlist signup was captured (e.g. cohort-full landing).
alter table public.study_waitlist
add column if not exists source text;

comment on column public.study_waitlist.source is
  'Origin of signup; e.g. donotage-suresleep-waitlist for cohort-full capture.';
