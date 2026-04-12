/**
 * Final 3-cohort synthetic validation seed: 18 users (6 per cohort ×3 slugs).
 *
 * Lifecycle slots per cohort (same order for each):
 *   1) applied (clean — no entries)
 *   2) abandoned_partial — applied, single check-in day only
 *   3) confirmed_preproduct — confirmed, study_started_at null, baseline-style entries
 *   4) active_study — confirmed, study clock started, entries through “recent” days
 *   5) completed — status completed + study_completed_at
 *   6) results_published — completed + cohort_participant_results published
 *
 * Run: npx dotenv-cli -e .env.local -- npx tsx scripts/seedCohortFinalValidation18.ts
 *
 * Auth users use profiles.user_id / cohort_participants.user_id = auth id (matches current deployment).
 */

import { createClient } from '@supabase/supabase-js'
import { validateCohortParticipantResultJsonForPublish } from '../src/lib/cohortParticipantResultPublishValidation'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !key) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const SLUGS = ['donotage-suresleep', 'seeking-health-optimal-focus', 'placeholder-cohort-v1'] as const

const PASSWORD = 'CohortVal2026!Final18'

const RENDERER_METRIC_KEYS = new Set([
  'sleep_quality',
  'energy',
  'focus',
  'mood',
  'mental_clarity',
  'calmness',
  'night_wakes',
  'night_wake',
])

type Slot =
  | 'applied_clean'
  | 'abandoned_partial'
  | 'confirmed_preproduct'
  | 'active_study'
  | 'completed'
  | 'results_published'

const SLOT_ORDER: Slot[] = [
  'applied_clean',
  'abandoned_partial',
  'confirmed_preproduct',
  'active_study',
  'completed',
  'results_published',
]

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(base: Date, n: number): Date {
  const x = new Date(base)
  x.setUTCDate(x.getUTCDate() + n)
  return x
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 3600 * 1000).toISOString()
}

async function fetchCohort(slug: string): Promise<{ id: string; checkin_fields: unknown }> {
  const { data, error } = await supabase.from('cohorts').select('id, checkin_fields').eq('slug', slug).maybeSingle()
  if (error || !data) throw new Error(`cohort ${slug}: ${error?.message || 'not found'}`)
  return data as { id: string; checkin_fields: unknown }
}

function normalizeFields(raw: unknown): string[] {
  if (!raw || !Array.isArray(raw)) return []
  return raw.map((x) => String(x).trim()).filter(Boolean)
}

function entryRow(
  uid: string,
  dayYmd: string,
  fields: string[],
  dayIndex: number,
  totalDays: number,
  tags: string[] = [],
): Record<string, unknown> {
  const progress = dayIndex / Math.max(1, totalDays - 1)
  const row: Record<string, unknown> = {
    user_id: uid,
    local_date: dayYmd,
    tags,
  }
  for (const f of fields) {
    if (f === 'sleep_onset_bucket') {
      row[f] = Math.max(1, 3 - Math.min(2, Math.floor(progress * 2.5)))
    } else if (f === 'night_wakes') {
      row[f] = Math.max(0, 2 - Math.floor(progress * 2))
    } else {
      const base = 4.5 + progress * 2.8
      const jitter = ((dayIndex * 13) % 5) * 0.12
      row[f] = Math.round(Math.min(10, Math.max(1, base + jitter)))
    }
  }
  return row
}

function buildEntries(uid: string, fields: string[], end: Date, nDays: number, tagDayIndex: number | null): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = []
  for (let d = 0; d < nDays; d++) {
    const dt = addDays(end, -(nDays - 1 - d))
    const tags = tagDayIndex === d ? ['high_stress'] : []
    rows.push(entryRow(uid, ymd(dt), fields, d, nDays, tags))
  }
  return rows
}

function publishedResultJson(fields: string[]): Record<string, unknown> {
  const metrics: Record<string, unknown> = {}
  for (const k of fields) {
    if (!RENDERER_METRIC_KEYS.has(k)) continue
    metrics[k] = { baseline_avg: 5, final_avg: 7.5 }
  }
  if (Object.keys(metrics).length === 0) {
    metrics.energy = { baseline_avg: 5, final_avg: 7 }
  }
  return {
    verdict: 'Synthetic validation publish',
    metrics,
  }
}

async function waitForProfile(authUserId: string): Promise<void> {
  for (let i = 0; i < 20; i++) {
    const { data } = await supabase.from('profiles').select('id').eq('user_id', authUserId).maybeSingle()
    if ((data as { id?: string } | null)?.id) return
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error(`no profile for ${authUserId}`)
}

async function createAuthUser(email: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`createUser ${email}: ${error?.message}`)
  return data.user.id
}

async function main() {
  const runTag = Date.now()
  const cohortBySlug = new Map<string, { id: string; fields: string[] }>()
  for (const slug of SLUGS) {
    const row = await fetchCohort(slug)
    cohortBySlug.set(slug, { id: row.id, fields: normalizeFields(row.checkin_fields) })
  }

  let created = 0
  const end = new Date()

  for (const slug of SLUGS) {
    const { id: cohortId, fields } = cohortBySlug.get(slug)!

    for (let s = 0; s < SLOT_ORDER.length; s++) {
      const slot = SLOT_ORDER[s]
      const email = `cohortfin.${String(slug).replace(/[^a-z0-9]/gi, '-')}.s${s}.${runTag}@invalidate.test`
      const authId = await createAuthUser(email)
      await waitForProfile(authId)
      await supabase.from('profiles').update({ cohort_id: slug }).eq('user_id', authId)

      let status: 'applied' | 'confirmed' | 'completed' = 'applied'
      let confirmed_at: string | null = null
      let study_started_at: string | null = null
      let study_completed_at: string | null = null

      switch (slot) {
        case 'applied_clean':
          status = 'applied'
          break
        case 'abandoned_partial':
          status = 'applied'
          break
        case 'confirmed_preproduct':
          status = 'confirmed'
          confirmed_at = isoDaysAgo(6)
          study_started_at = null
          break
        case 'active_study':
          status = 'confirmed'
          confirmed_at = isoDaysAgo(18)
          study_started_at = `${ymd(addDays(end, -12))}T00:00:00.000Z`
          break
        case 'completed':
        case 'results_published':
          status = 'completed'
          confirmed_at = isoDaysAgo(45)
          study_started_at = `${ymd(addDays(end, -38))}T00:00:00.000Z`
          study_completed_at = `${ymd(addDays(end, -10))}T12:00:00.000Z`
          break
        default:
          break
      }

      const { error: cpErr } = await supabase.from('cohort_participants').insert({
        user_id: authId,
        cohort_id: cohortId,
        status,
        enrolled_at: isoDaysAgo(2),
        confirmed_at,
        study_started_at,
        study_completed_at,
      })
      if (cpErr) throw new Error(`cohort_participants ${email}: ${cpErr.message}`)

      let rows: Record<string, unknown>[] = []
      if (slot === 'abandoned_partial' && fields.length) {
        rows = buildEntries(authId, fields, end, 1, null)
      } else if (slot === 'confirmed_preproduct' && fields.length) {
        rows = buildEntries(authId, fields, end, 12, null)
      } else if (slot === 'active_study' && fields.length) {
        rows = buildEntries(authId, fields, end, 22, null)
      } else if ((slot === 'completed' || slot === 'results_published') && fields.length) {
        rows = buildEntries(authId, fields, end, 30, null)
      }

      if (rows.length) {
        const { error: deErr } = await supabase.from('daily_entries').insert(rows)
        if (deErr) throw new Error(`daily_entries ${email}: ${deErr.message}`)
      }

      if (slot === 'results_published') {
        const resultJson = publishedResultJson(fields)
        const v = validateCohortParticipantResultJsonForPublish({
          resultCohortId: cohortId,
          participantCohortId: cohortId,
          cohortCheckinFieldsRaw: fields,
          resultJson,
        })
        if (!v.ok) throw new Error(`result_json invalid: ${(v as { errors: string[] }).errors.join('; ')}`)

        const { error: rErr } = await supabase.from('cohort_participant_results').upsert(
          {
            user_id: authId,
            cohort_id: cohortId,
            status: 'published',
            published_at: new Date().toISOString(),
            result_json: resultJson,
          },
          { onConflict: 'user_id,cohort_id' },
        )
        if (rErr) throw new Error(`cohort_participant_results ${email}: ${rErr.message}`)
      }

      console.log('ok', slug, slot, email)
      created++
    }
  }

  console.log('\nDone. Users created:', created, 'runTag:', runTag)
  console.log('Password for all:', PASSWORD)
  for (const slug of SLUGS) {
    const cid = cohortBySlug.get(slug)!.id
    const { data: parts } = await supabase.from('cohort_participants').select('status').eq('cohort_id', cid)
    const by: Record<string, number> = {}
    for (const r of parts || []) {
      const st = (r as { status: string }).status
      by[st] = (by[st] || 0) + 1
    }
    console.log('cohort', slug, 'status counts (includes pre-existing rows):', by)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
