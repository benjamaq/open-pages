-- Effect Engine Core Tables
-- Note: We avoid direct FK to auth.users for portability; store user_id UUID and index it.

create table if not exists user_supplement_effect (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    user_supplement_id uuid not null references user_supplement(id),

    effect_direction text,             -- 'positive' | 'negative' | 'neutral'
    effect_magnitude double precision, -- standardized effect size (Cohen's d)
    effect_confidence double precision, -- 0–1 bootstrap CI strength
    effect_category text,              -- 'works' | 'no_effect' | 'inconsistent' | 'needs_more_data'

    days_on integer,
    days_off integer,
    clean_days integer,
    noisy_days integer,

    pre_start_average double precision,
    post_start_average double precision,

    analysis_mode text,                -- 'auto' or 'advanced'

    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create index if not exists idx_user_supplement_effect_user on user_supplement_effect(user_id);
create index if not exists idx_user_supplement_effect_supp on user_supplement_effect(user_supplement_id);
-- Ensure upsert target has a unique constraint
create unique index if not exists uniq_user_supplement_effect_user_supp
  on user_supplement_effect(user_id, user_supplement_id);

create table if not exists daily_processed_scores (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    date date not null,

    mood double precision,
    energy double precision,
    focus double precision,
    composite_score double precision,

    noise_score integer,
    is_clean boolean,

    sleep_score double precision,
    hrv double precision,
    recovery double precision,

    created_at timestamp with time zone default now()
);

create unique index if not exists uniq_daily_processed_scores_user_date on daily_processed_scores(user_id, date);
create index if not exists idx_daily_processed_scores_user on daily_processed_scores(user_id);

create table if not exists effect_history (
    id uuid primary key default gen_random_uuid(),
    user_supplement_effect_id uuid references user_supplement_effect(id),
    snapshot jsonb,
    created_at timestamp with time zone default now()
);


