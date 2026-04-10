/**
 * Phase 2 validation seed: ≥15 synthetic cohort participants + daily_entries for report v2.
 *
 * Run: npx dotenv-cli -e .env.local -- npx tsx scripts/seedCohortPhase2Validation.ts
 *
 * Creates auth users + profiles (trigger), cohort_participants, daily_entries.
 * Uses auth user id for cohort_participants.user_id + daily_entries.user_id (matches this deployment’s FK).
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !key) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const SLUGS = {
  dna: 'donotage-suresleep',
  sh: 'seeking-health-optimal-focus',
  ph: 'placeholder-cohort-v1',
} as const

const CONFOUND = new Set(['illness', 'alcohol', 'high_stress', 'travel', 'poor_sleep'])

type Lifecycle = 'report_a' | 'report_b' | 'applied_sparse' | 'confirmed_sparse' | 'dropped'

const PLAN: { slug: string; lifecycle: Lifecycle }[] = [
  // DoNotAge (5)
  { slug: SLUGS.dna, lifecycle: 'report_a' },
  { slug: SLUGS.dna, lifecycle: 'report_b' },
  { slug: SLUGS.dna, lifecycle: 'applied_sparse' },
  { slug: SLUGS.dna, lifecycle: 'confirmed_sparse' },
  { slug: SLUGS.dna, lifecycle: 'dropped' },
  // Seeking Health (5)
  { slug: SLUGS.sh, lifecycle: 'report_a' },
  { slug: SLUGS.sh, lifecycle: 'report_b' },
  { slug: SLUGS.sh, lifecycle: 'applied_sparse' },
  { slug: SLUGS.sh, lifecycle: 'confirmed_sparse' },
  { slug: SLUGS.sh, lifecycle: 'dropped' },
  // Placeholder (5)
  { slug: SLUGS.ph, lifecycle: 'report_a' },
  { slug: SLUGS.ph, lifecycle: 'report_b' },
  { slug: SLUGS.ph, lifecycle: 'applied_sparse' },
  { slug: SLUGS.ph, lifecycle: 'confirmed_sparse' },
  { slug: SLUGS.ph, lifecycle: 'dropped' },
]

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(base: Date, n: number): Date {
  const x = new Date(base)
  x.setUTCDate(x.getUTCDate() + n)
  return x
}

async function fetchCohortIdAndFields(slug: string): Promise<{ id: string; checkin_fields: unknown }> {
  const { data, error } = await supabase.from('cohorts').select('id, checkin_fields').eq('slug', slug).maybeSingle()
  if (error || !data) throw new Error(`cohort ${slug}: ${error?.message || 'not found'}`)
  return data as { id: string; checkin_fields: unknown }
}

function normalizeFields(raw: unknown): string[] {
  if (!raw || !Array.isArray(raw)) return []
  return raw.map((x) => String(x).trim()).filter(Boolean)
}

function entryRowForDay(
  participantUserId: string,
  dayYmd: string,
  fields: string[],
  dayIndex: number,
  totalDays: number,
): Record<string, unknown> {
  const progress = dayIndex / Math.max(1, totalDays - 1)
  const row: Record<string, unknown> = {
    user_id: participantUserId,
    local_date: dayYmd,
    tags: [] as string[],
  }

  for (const f of fields) {
    if (f === 'sleep_onset_bucket') {
      const v = 3 - Math.min(2, Math.floor(progress * 2.5))
      row[f] = Math.max(1, v)
    } else if (f === 'night_wakes') {
      row[f] = Math.max(0, 2 - Math.floor(progress * 2))
    } else {
      const base = 4.5 + progress * 3.2
      const jitter = ((dayIndex * 17) % 5) * 0.15
      row[f] = Math.round(Math.min(10, Math.max(1, base + jitter)))
    }
  }
  return row
}

async function waitForProfile(authUserId: string, tries = 15): Promise<void> {
  for (let i = 0; i < tries; i++) {
    const { data } = await supabase.from('profiles').select('id').eq('user_id', authUserId).maybeSingle()
    if ((data as { id?: string } | null)?.id) return
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error(`no profile for auth user ${authUserId}`)
}

async function createAuthUser(email: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: 'CohortVal2026!Phase2',
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`createUser ${email}: ${error?.message}`)
  return data.user.id
}

async function main() {
  const runTag = Date.now()
  const cohortMeta = new Map<string, { id: string; fields: string[] }>()
  for (const s of new Set(PLAN.map((p) => p.slug))) {
    const row = await fetchCohortIdAndFields(s)
    cohortMeta.set(s, { id: row.id, fields: normalizeFields(row.checkin_fields) })
  }

  const created: { email: string; authUserId: string; slug: string; lifecycle: Lifecycle }[] = []

  for (let i = 0; i < PLAN.length; i++) {
    const { slug, lifecycle } = PLAN[i]
    const email = `cohortp2.${slug.replace(/[^a-z0-9]/gi, '-')}.${i}.${runTag}@invalidate.test`
    const authId = await createAuthUser(email)
    await waitForProfile(authId)
    await supabase.from('profiles').update({ cohort_id: slug }).eq('user_id', authId)

    const { id: cohortId, fields } = cohortMeta.get(slug)!

    let status: 'applied' | 'confirmed' | 'dropped' = 'applied'
    let confirmed_at: string | null = null
    let study_started_at: string | null = null

    if (lifecycle === 'report_a' || lifecycle === 'report_b' || lifecycle === 'confirmed_sparse') {
      status = 'confirmed'
      confirmed_at = new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString()
      study_started_at = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
    } else if (lifecycle === 'dropped') {
      status = 'dropped'
    }

    const { error: cpErr } = await supabase.from('cohort_participants').insert({
      user_id: authId,
      cohort_id: cohortId,
      status,
      enrolled_at: new Date().toISOString(),
      confirmed_at,
      study_started_at,
    })
    if (cpErr) throw new Error(`cohort_participants ${email}: ${cpErr.message}`)

    const end = new Date()
    const nDays = lifecycle === 'report_a' || lifecycle === 'report_b' ? 28 : lifecycle === 'applied_sparse' ? 2 : lifecycle === 'confirmed_sparse' ? 5 : 0

    if (nDays > 0 && fields.length > 0) {
      const rows: Record<string, unknown>[] = []
      for (let d = 0; d < nDays; d++) {
        const dt = addDays(end, -(nDays - 1 - d))
        const row = entryRowForDay(authId, ymd(dt), fields, d, nDays)
        if (lifecycle === 'applied_sparse' && d === 1) {
          row.tags = ['high_stress']
        }
        rows.push(row)
      }
      const { error: deErr } = await supabase.from('daily_entries').insert(rows)
      if (deErr) throw new Error(`daily_entries ${email}: ${deErr.message}`)
    }

    created.push({ email, authUserId: authId, slug, lifecycle })
    console.log('ok', slug, lifecycle, email)
  }

  // Cross-cohort contamination row: same profile in SH (applied) + placeholder (confirmed).
  const crossEmail = `cohortp2.cross.${runTag}@invalidate.test`
  const crossAuth = await createAuthUser(crossEmail)
  await waitForProfile(crossAuth)
  await supabase.from('profiles').update({ cohort_id: SLUGS.ph }).eq('user_id', crossAuth)

  const shId = cohortMeta.get(SLUGS.sh)!.id
  const phId = cohortMeta.get(SLUGS.ph)!.id

  const { error: cpCross1 } = await supabase.from('cohort_participants').insert({
    user_id: crossAuth,
    cohort_id: shId,
    status: 'applied',
    enrolled_at: new Date().toISOString(),
  })
  if (cpCross1) throw new Error(`cross SH: ${cpCross1.message}`)

  const { error: cpCross2 } = await supabase.from('cohort_participants').insert({
    user_id: crossAuth,
    cohort_id: phId,
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
    study_started_at: new Date().toISOString(),
  })
  if (cpCross2) throw new Error(`cross PH: ${cpCross2.message}`)

  const phFields = cohortMeta.get(SLUGS.ph)!.fields
  const crossRows: Record<string, unknown>[] = []
  for (let d = 0; d < 28; d++) {
    const dt = addDays(new Date(), -(27 - d))
    crossRows.push(entryRowForDay(crossAuth, ymd(dt), phFields, d, 28))
  }
  const { error: deCross } = await supabase.from('daily_entries').insert(crossRows)
  if (deCross) throw new Error(`cross entries: ${deCross.message}`)

  console.log('\nCreated', created.length + 1, 'users. Run tag:', runTag)
  console.log('Cross user:', crossEmail, 'auth', crossAuth)

  // Sanity: counts per cohort / status
  for (const slug of [SLUGS.dna, SLUGS.sh, SLUGS.ph]) {
    const cid = cohortMeta.get(slug)!.id
    const { data: parts } = await supabase.from('cohort_participants').select('status').eq('cohort_id', cid)
    const by = (parts || []).reduce(
      (acc: Record<string, number>, r: { status: string }) => {
        acc[r.status] = (acc[r.status] || 0) + 1
        return acc
      },
      {},
    )
    console.log('participants', slug, by)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
