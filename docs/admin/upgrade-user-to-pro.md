---
title: Upgrade a user to Pro (DB-only)
---

## Source of truth

- **Primary flag used by the app**: `profiles.tier`
  - `pro` / `premium` / `creator` are treated as **paid** in `GET /api/billing/info`
  - See: `src/app/api/billing/info/route.ts`

- **Stripe-based users**: `user_usage.stripe_customer_id` + Stripe subscription status may also indicate paid.
  - Important: some environments may **not** have `user_usage.tier` (historically caused errors). The app intentionally derives paid-ness from `profiles.tier` to support DB-only upgrades.

## DB-only upgrade (by email)

Run this in Supabase SQL editor:

```sql
-- 1) Upgrade by email
update profiles
set tier = 'pro',
    updated_at = now()
where user_id = (
  select id
  from auth.users
  where lower(email) = lower('their@email.com')
);

-- 2) Invalidate dashboard cache so UI reflects it immediately
insert into dashboard_cache (user_id, invalidated_at)
values (
  (select id from auth.users where lower(email) = lower('their@email.com')),
  now()
)
on conflict (user_id) do update
set invalidated_at = excluded.invalidated_at;
```

## Verification

As the user, hit:

- `/api/billing/info?debug=1`

Expected:

- `"isPaid": true`
- `"_debug.tierLc": "pro"`


