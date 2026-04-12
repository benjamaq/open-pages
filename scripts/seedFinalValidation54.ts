/**
 * Final 54-user 3-cohort validation seed (18 slots × 3 cohorts).
 *
 * DO NOT run until you confirm the target Supabase project — creates auth users + data.
 *
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/seedFinalValidation54.ts
 *
 * Optional real inboxes (6 users) — set in .env.local before run:
 *   FINAL54_REAL_EMAIL_DONOTAGE_S9
 *   FINAL54_REAL_EMAIL_DONOTAGE_S14
 *   FINAL54_REAL_EMAIL_SEEKING_HEALTH_S9
 *   FINAL54_REAL_EMAIL_SEEKING_HEALTH_S14
 *   FINAL54_REAL_EMAIL_PLACEHOLDER_S9
 *   FINAL54_REAL_EMAIL_PLACEHOLDER_S14
 *
 * Every auth user gets user_metadata: { seed_batch: "final54", run_tag: "<runTag>" }.
 * Every daily_entries row includes tags final54 + runTag (string).
 */

import { createClient } from '@supabase/supabase-js'
import { validateCohortParticipantResultJsonForPublish } from '../src/lib/cohortParticipantResultPublishValidation'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

const PASSWORD = 'CohortVal2026!Final54'
const SEED_BATCH = 'final54'

/** Only keys that are end-to-end supported for each cohort (do not add new metrics here). */
const METRICS_BY_SLUG: Record<string, readonly string[]> = {
  'donotage-suresleep': ['sleep_quality', 'energy', 'sleep_onset_bucket', 'night_wakes'],
  'seeking-health-optimal-focus': ['focus', 'energy', 'mental_clarity'],
  'placeholder-cohort-v1': ['energy', 'mood', 'calmness'],
}

const COHORT_SLUGS = [
  'donotage-suresleep',
  'seeking-health-optimal-focus',
  'placeholder-cohort-v1',
] as const

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

type SlotKind =
  | 'applied'
  | 'abandoned_compliance'
  | 'confirmed_preproduct'
  | 'active_day_3'
  | 'active_day_8'
  | 'active_day_14'
  | 'active_day_19'
  | 'completed_no_publish'
  | 'completed_published'
  | 'completed_confounds'

/** s0–s17 lifecycle mapping (same for each cohort). */
const SLOT_KINDS: SlotKind[] = [
  'applied',
  'applied',
  'applied',
  'abandoned_compliance',
  'abandoned_compliance',
  'confirmed_preproduct',
  'confirmed_preproduct',
  'active_day_3',
  'active_day_8',
  'active_day_14',
  'active_day_19',
  'completed_no_publish',
  'completed_no_publish',
  'completed_no_publish',
  'completed_published',
  'completed_published',
  'completed_confounds',
  'completed_confounds',
]

function addDaysYmd(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + delta)
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function daysBetweenInclusiveUtcYmd(startYmd: string, endYmd: string): number {
  const [y1, m1, d1] = startYmd.split('-').map(Number)
  const [y2, m2, d2] = endYmd.split('-').map(Number)
  const t1 = Date.UTC(y1, m1 - 1, d1)
  const t2 = Date.UTC(y2, m2 - 1, d2)
  return Math.floor((t2 - t1) / 86400000)
}

function utcTodayYmd(): string {
  return new Date().toISOString().slice(0, 10)
}

function isoUtc(d: Date): string {
  return d.toISOString()
}

/** study_started_at calendar day such that /api/me study current day matches targetDay (inclusive rule). */
function studyStartYmdForDashboardDay(targetDay: number, todayYmd: string): string {
  const delta = targetDay - 1
  return addDaysYmd(todayYmd, -delta)
}

function publishedResultJson(slug: string, cohortUuid: string): Record<string, unknown> {
  const fields = [...METRICS_BY_SLUG[slug]]
  const metrics: Record<string, unknown> = {}
  for (const k of fields) {
    if (!RENDERER_METRIC_KEYS.has(k)) continue
    metrics[k] = { baseline_avg: 5, final_avg: 7.5 }
  }
  if (Object.keys(metrics).length === 0) {
    metrics.energy = { baseline_avg: 5, final_avg: 7 }
  }
  const resultJson = {
    verdict: 'Final54 synthetic publish',
    metrics,
  }
  const v = validateCohortParticipantResultJsonForPublish({
    resultCohortId: cohortUuid,
    participantCohortId: cohortUuid,
    cohortCheckinFieldsRaw: fields,
    resultJson,
  })
  if (!v.ok) throw new Error(`result_json: ${(v as { errors: string[] }).errors.join('; ')}`)
  return resultJson
}

function resolveEmail(slug: string, slot: number, runTag: string): string {
  const envKey = (() => {
    if (slug === 'donotage-suresleep') {
      if (slot === 9) return 'FINAL54_REAL_EMAIL_DONOTAGE_S9'
      if (slot === 14) return 'FINAL54_REAL_EMAIL_DONOTAGE_S14'
    }
    if (slug === 'seeking-health-optimal-focus') {
      if (slot === 9) return 'FINAL54_REAL_EMAIL_SEEKING_HEALTH_S9'
      if (slot === 14) return 'FINAL54_REAL_EMAIL_SEEKING_HEALTH_S14'
    }
    if (slug === 'placeholder-cohort-v1') {
      if (slot === 9) return 'FINAL54_REAL_EMAIL_PLACEHOLDER_S9'
      if (slot === 14) return 'FINAL54_REAL_EMAIL_PLACEHOLDER_S14'
    }
    return null
  })()
  if (envKey) {
    const v = String(process.env[envKey] || '').trim()
    if (v) {
      console.warn(`Using real email from ${envKey} for ${slug} s${slot}`)
      return v
    }
  }
  const slugPart = slug.replace(/[^a-z0-9]/gi, '-')
  return `cohortfin54.${slugPart}.s${slot}.${runTag}@invalidate.test`
}

function entryRow(
  uid: string,
  localYmd: string,
  metricKeys: readonly string[],
  valuesSeed: number,
  runTag: string,
  extraTags: string[],
  createdAtIso: string,
): Record<string, unknown> {
  const progress = (valuesSeed % 97) / 97
  const row: Record<string, unknown> = {
    user_id: uid,
    local_date: localYmd,
    tags: ['final54', runTag, ...extraTags],
    created_at: createdAtIso,
  }
  for (const f of metricKeys) {
    if (f === 'sleep_onset_bucket') {
      row[f] = Math.max(1, 3 - (valuesSeed % 3))
    } else if (f === 'night_wakes') {
      row[f] = Math.max(0, (valuesSeed % 3) - 1)
    } else {
      const base = 4 + progress * 4
      row[f] = Math.round(Math.min(10, Math.max(1, base + (valuesSeed % 5) * 0.1)))
    }
  }
  return row
}

async function main() {
  if (!url || !key) {
    console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  const runTag = String(Date.now())
  const todayYmd = utcTodayYmd()

  const cohortRows = new Map<string, { id: string }>()
  for (const slug of COHORT_SLUGS) {
    const { data, error } = await supabase.from('cohorts').select('id').eq('slug', slug).maybeSingle()
    if (error || !data) throw new Error(`cohort ${slug}: ${error?.message || 'missing'}`)
    cohortRows.set(slug, { id: (data as { id: string }).id })
  }

  async function waitProfile(authUserId: string): Promise<void> {
    for (let i = 0; i < 25; i++) {
      const { data } = await supabase.from('profiles').select('id').eq('user_id', authUserId).maybeSingle()
      if (data && (data as { id?: string }).id) return
      await new Promise((r) => setTimeout(r, 200))
    }
    throw new Error(`no profile for ${authUserId}`)
  }

  async function createAuth(email: string): Promise<string> {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { seed_batch: SEED_BATCH, run_tag: runTag },
    })
    if (error || !data.user) throw new Error(`createUser ${email}: ${error?.message}`)
    return data.user.id
  }

  for (const slug of COHORT_SLUGS) {
    const cohortId = cohortRows.get(slug)!.id
    const metricKeys = METRICS_BY_SLUG[slug]

    for (let slot = 0; slot < 18; slot++) {
      const kind = SLOT_KINDS[slot]
      const email = resolveEmail(slug, slot, runTag)
      const authId = await createAuth(email)
      await waitProfile(authId)
      await supabase.from('profiles').update({ cohort_id: slug }).eq('user_id', authId)

      let status: 'applied' | 'confirmed' | 'completed' | 'dropped' = 'applied'
      let enrolled_at = isoUtc(new Date(Date.now() - 2 * 3600 * 1000))
      let confirmed_at: string | null = null
      let study_started_at: string | null = null
      let study_completed_at: string | null = null

      const insertParticipant = async () => {
        const { error: e } = await supabase.from('cohort_participants').insert({
          user_id: authId,
          cohort_id: cohortId,
          status,
          enrolled_at,
          confirmed_at,
          study_started_at,
          study_completed_at,
        })
        if (e) throw new Error(`cohort_participants ${slug} s${slot}: ${e.message}`)
      }

      const insertEntries = async (rows: Record<string, unknown>[]) => {
        if (rows.length === 0) return
        const { error: e } = await supabase.from('daily_entries').insert(rows)
        if (e) throw new Error(`daily_entries ${slug} s${slot}: ${e.message}`)
      }

      if (kind === 'applied') {
        status = 'applied'
        await insertParticipant()
        continue
      }

      if (kind === 'abandoned_compliance') {
        status = 'applied'
        enrolled_at = isoUtc(new Date(Date.now() - 72 * 3600 * 1000))
        await insertParticipant()
        const y = addDaysYmd(enrolled_at.slice(0, 10), 1)
        const afterEnroll = new Date(enrolled_at).getTime() + 3600 * 1000
        await insertEntries([
          entryRow(authId, y, metricKeys, slot + 7, runTag, [], isoUtc(new Date(afterEnroll))),
        ])
        continue
      }

      if (kind === 'confirmed_preproduct') {
        status = 'confirmed'
        confirmed_at = isoUtc(new Date(Date.now() - 5 * 24 * 3600 * 1000))
        study_started_at = null
        enrolled_at = isoUtc(new Date(Date.now() - 6 * 24 * 3600 * 1000))
        await insertParticipant()
        const end = new Date()
        const rows: Record<string, unknown>[] = []
        for (let d = 0; d < 10; d++) {
          const dt = new Date(end)
          dt.setUTCDate(dt.getUTCDate() - (9 - d))
          const ymd = dt.toISOString().slice(0, 10)
          rows.push(
            entryRow(authId, ymd, metricKeys, slot + d, runTag, [], isoUtc(new Date(dt.getTime() + 3600 * 1000))),
          )
        }
        await insertEntries(rows)
        continue
      }

      if (kind.startsWith('active_day_')) {
        const day = Number(kind.replace('active_day_', ''))
        const studyYmd = studyStartYmdForDashboardDay(day, todayYmd)
        status = 'confirmed'
        confirmed_at = isoUtc(new Date(Date.now() - 20 * 24 * 3600 * 1000))
        study_started_at = `${studyYmd}T00:00:00.000Z`
        enrolled_at = isoUtc(new Date(Date.now() - 25 * 24 * 3600 * 1000))
        await insertParticipant()
        const rows: Record<string, unknown>[] = []
        for (let i = 0; i <= daysBetweenInclusiveUtcYmd(studyYmd, todayYmd); i++) {
          const ymd = addDaysYmd(studyYmd, i)
          const created = `${ymd}T14:00:00.000Z`
          rows.push(entryRow(authId, ymd, metricKeys, slot * 10 + i, runTag, [], created))
        }
        await insertEntries(rows)
        continue
      }

      if (kind === 'completed_no_publish') {
        status = 'completed'
        confirmed_at = isoUtc(new Date(Date.now() - 50 * 24 * 3600 * 1000))
        const startYmd = addDaysYmd(todayYmd, -40)
        study_started_at = `${startYmd}T00:00:00.000Z`
        study_completed_at = isoUtc(new Date(Date.now() - 5 * 24 * 3600 * 1000))
        enrolled_at = isoUtc(new Date(Date.now() - 55 * 24 * 3600 * 1000))
        await insertParticipant()
        const rows: Record<string, unknown>[] = []
        for (let i = 0; i < 28; i++) {
          const ymd = addDaysYmd(startYmd, i)
          rows.push(entryRow(authId, ymd, metricKeys, slot + i, runTag, [], `${ymd}T15:00:00.000Z`))
        }
        await insertEntries(rows)
        continue
      }

      if (kind === 'completed_published') {
        status = 'completed'
        confirmed_at = isoUtc(new Date(Date.now() - 50 * 24 * 3600 * 1000))
        const startYmd = addDaysYmd(todayYmd, -40)
        study_started_at = `${startYmd}T00:00:00.000Z`
        study_completed_at = isoUtc(new Date(Date.now() - 4 * 24 * 3600 * 1000))
        enrolled_at = isoUtc(new Date(Date.now() - 55 * 24 * 3600 * 1000))
        await insertParticipant()
        const rows: Record<string, unknown>[] = []
        for (let i = 0; i < 28; i++) {
          const ymd = addDaysYmd(startYmd, i)
          rows.push(entryRow(authId, ymd, metricKeys, slot + i, runTag, [], `${ymd}T15:00:00.000Z`))
        }
        await insertEntries(rows)
        const resultJson = publishedResultJson(slug, cohortId)
        const { error: re } = await supabase.from('cohort_participant_results').upsert(
          {
            user_id: authId,
            cohort_id: cohortId,
            status: 'published',
            published_at: new Date().toISOString(),
            result_json: resultJson,
          },
          { onConflict: 'user_id,cohort_id' },
        )
        if (re) throw new Error(`results ${slug} s${slot}: ${re.message}`)
        continue
      }

      if (kind === 'completed_confounds') {
        status = 'completed'
        confirmed_at = isoUtc(new Date(Date.now() - 50 * 24 * 3600 * 1000))
        const startYmd = addDaysYmd(todayYmd, -38)
        study_started_at = `${startYmd}T00:00:00.000Z`
        study_completed_at = isoUtc(new Date(Date.now() - 3 * 24 * 3600 * 1000))
        enrolled_at = isoUtc(new Date(Date.now() - 55 * 24 * 3600 * 1000))
        await insertParticipant()
        const rows: Record<string, unknown>[] = []
        for (let i = 0; i < 28; i++) {
          const ymd = addDaysYmd(startYmd, i)
          const confound = i < 6 ? ['high_stress'] : []
          rows.push(entryRow(authId, ymd, metricKeys, slot * 3 + i, runTag, confound, `${ymd}T16:00:00.000Z`))
        }
        await insertEntries(rows)
        continue
      }
    }
  }

  console.log('\n=== seedFinalValidation54 complete ===')
  console.log('runTag:', runTag)
  console.log('seed_batch:', SEED_BATCH)
  console.log('password:', PASSWORD)
  console.log('Cleanup: npx dotenv-cli -e .env.local -- npx tsx scripts/cleanupFinalValidation54.ts --runTag', runTag)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
