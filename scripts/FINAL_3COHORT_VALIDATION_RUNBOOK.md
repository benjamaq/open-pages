# Final 3-cohort synthetic validation runbook

## Seed (18 users)

```bash
npx dotenv-cli -e .env.local -- npx tsx scripts/seedCohortFinalValidation18.ts
```

- **6 per cohort:** `donotage-suresleep`, `seeking-health-optimal-focus`, `placeholder-cohort-v1`
- **Slots (same order each):** applied_clean → abandoned_partial → confirmed_preproduct → active_study → completed → results_published
- **Password (all):** `CohortVal2026!Final18`
- **Emails:** `cohortfin.<slug>.s0..s5.<runTag>@invalidate.test`

## Report v2 (real Supabase data)

```bash
npx dotenv-cli -e .env.local -- sh -c 'export SUPABASE_URL="${SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}"; \
  python3 -m scripts.cohort_report_v2.generate_report --cohort donotage-suresleep --out /tmp/final_dna.pdf && \
  python3 -m scripts.cohort_report_v2.generate_report --cohort seeking-health-optimal-focus --out /tmp/final_sh.pdf && \
  python3 -m scripts.cohort_report_v2.generate_report --cohort placeholder-cohort-v1 --out /tmp/final_ph.pdf'
```

(`fetch.py` only includes **confirmed** participants with check-ins; completed/published rows still affect cohort-wide data only indirectly.)

## Cron (local or deployed base URL)

Use `Authorization: Bearer $CRON_SECRET` or `?key=$CRON_SECRET`. Examples:

```bash
npx dotenv-cli -e .env.local -- sh -c \
  'curl -sS -H "Authorization: Bearer $CRON_SECRET" "http://127.0.0.1:3010/api/cron/cohort-compliance?dry=1"'
```

Paths:

- `/api/cron/cohort-compliance` — applied → confirm/drop
- `/api/cron/cohort-gate-reminder` — 24h gate reminder
- `/api/cron/cohort-shipping-nurture` — pre-product nurture
- `/api/cron/cohort-study-completion` — complete window, completion + result-ready emails
- `/api/cron/send-daily-emails` — daily reminders (cohort filters inside)

Prefer **`dry=1`** until you intend to send real email.

## Transactional emails (manual / integration)

| Email | Typical trigger |
|--------|------------------|
| Compliance confirmed | Cron `cohort-compliance` or immediate confirm on 2nd qualifying check-in via app |
| Study start | `POST /api/cohort/start-study` from dashboard after product arrival |
| Completion / result-ready | Cron `cohort-study-completion` (non-dry) with eligible participants |

Verify delivery via **Resend** dashboard or a **real recipient** address (not `@invalidate.test` if undeliverable).
