# biostackr.io email deliverability (Resend)

Code cannot verify DNS from the repo. Use the **Resend dashboard** as the source of truth for exact record **names and values**.

## What to verify

1. Open [Resend → Domains](https://resend.com/domains).
2. Add or select **`biostackr.io`** (or the subdomain Resend recommends).
3. Click **Verify DNS records** and fix anything showing as missing or failed.

Resend expects at minimum ([docs](https://resend.com/docs/dashboard/domains/introduction)):

- **SPF** – TXT (and related bounce/return-path setup as shown in the UI; often involves a **`send`** subdomain and may include **MX** for return path).
- **DKIM** – TXT on the host Resend shows (commonly a `resend._domainkey` or similar name) with a **unique public key** copied from the dashboard.
- **DMARC** – optional in Resend until SPF/DKIM pass; strongly recommended for Gmail. Add a TXT record at **`_dmarc.biostackr.io`** only after confirming the exact value (policy, reporting) you want, e.g. start with monitoring:

  `v=DMARC1; p=none; rua=mailto:YOU@YOURDOMAIN`

  Tighten `p=` after you confirm legitimate mail passes alignment.

## Why Gmail may still spam

- **From address** must use a domain (or subdomain) that is **verified** in Resend (`reminders@biostackr.io` requires `biostackr.io` — or the relevant subdomain — to show **verified**, not pending).
- **SPF + DKIM alignment** should both pass (check Gmail “Show original” → SPF/DKIM results).
- **Low domain reputation** on a new domain improves over time; avoid sudden volume spikes.

## After schema change

Apply migration `20260404120000_cohort_post_first_checkin_email.sql` so the post-check-in email claim column exists.
