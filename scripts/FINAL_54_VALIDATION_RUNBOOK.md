# Final 54-user 3-cohort validation runbook

## Scope

- **54 synthetic users:** 18 per cohort × `donotage-suresleep`, `seeking-health-optimal-focus`, `placeholder-cohort-v1`.
- **Metrics written in seed** are **only** the keys already used end-to-end (see `METRICS_BY_SLUG` in `seedFinalValidation54.ts`).
- **Markers:** `user_metadata.seed_batch = "final54"`, `user_metadata.run_tag = "<runTag>"`; each `daily_entries` row includes tags `final54` and the runTag string.

## Seed (do not run on production without review)

```bash
npx dotenv-cli -e .env.local -- npx tsx scripts/seedFinalValidation54.ts
```

- **Password (all seeded users):** `CohortVal2026!Final54`
- **Default email:** `cohortfin54.<slug-normalized>.s<slot>.<runTag>@invalidate.test`

### Real inboxes (optional — 6 accounts)

Set before seeding so **s9** and **s14** per cohort receive mail:

| Env var | Cohort slot |
|---------|-------------|
| `FINAL54_REAL_EMAIL_DONOTAGE_S9` | DoNotAge, active day14 |
| `FINAL54_REAL_EMAIL_DONOTAGE_S14` | DoNotAge, completed + published |
| `FINAL54_REAL_EMAIL_SEEKING_HEALTH_S9` | Seeking Health, active day 14 |
| `FINAL54_REAL_EMAIL_SEEKING_HEALTH_S14` | Seeking Health, completed + published |
| `FINAL54_REAL_EMAIL_PLACEHOLDER_S9` | Placeholder, active day 14 |
| `FINAL54_REAL_EMAIL_PLACEHOLDER_S14` | Placeholder, completed + published |

**s15 does not need a real email:** **s14** already covers “completed + results published”; s15 is a second published row for volume only.

## Lifecycle slots (s0–s17, repeated per cohort)

| Slots | Shape |
|-------|--------|
| s0–s2 | Applied, no entries |
| s3–s4 | Applied, one check-in, enrolled &gt;48h ago (compliance abandon candidate) |
| s5–s6 | Confirmed, product not arrived (`study_started_at` null), baseline entries |
| s7, s8, s9, s10 | Active study (dashboard study days3, 8, 14, 19 vs UTC `today`) |
| s11–s13 | Completed, no published result row |
| s14–s15 | Completed + `cohort_participant_results` published |
| s16–s17 | Completed + ≥6 days tagged `high_stress` (confound-heavy) |

## Cleanup (destructive)

**By one run:**

```bash
npx dotenv-cli -e .env.local -- npx tsx scripts/cleanupFinalValidation54.ts --runTag=<runTagPrintedBySeed>
```

**All `final54` batches** (every user with `seed_batch === "final54"`, any `run_tag`):

```bash
npx dotenv-cli -e .env.local -- npx tsx scripts/cleanupFinalValidation54.ts --all
```

Removes: `cohort_participant_results`, `daily_entries`, `cohort_participants`, `profiles` (by `user_id`), then `auth.users`.

## Report v2 (after seed)

```bash
npx dotenv-cli -e .env.local -- sh -c 'export SUPABASE_URL="${SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}"; \
  for c in donotage-suresleep seeking-health-optimal-focus placeholder-cohort-v1; do \
    python3 -m scripts.cohort_report_v2.generate_report --cohort "$c" --out "/tmp/final54_${c//-/_}.pdf"; \
  done'
```

Note: report fetch uses **confirmed** participants only; completed/published slots affect cohort data indirectly.

## Cron smoke (local or deployed)

Use `Authorization: Bearer $CRON_SECRET` or `?key=`. Prefer `dry=1` first.

- `/api/cron/cohort-compliance`
- `/api/cron/cohort-gate-reminder`
- `/api/cron/cohort-shipping-nurture`
- `/api/cron/cohort-study-completion`
- `/api/cron/send-daily-emails`

## Be extra careful?

**Yes.** The seed creates **54 auth identities** and rich `daily_entries`. Cleanup **deletes auth users** and related rows — wrong project or `--all` on a shared dev DB is destructive. Use a **dedicated staging project** or a **known runTag** + `--runTag=` cleanup only.
