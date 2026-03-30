import { supabaseAdmin } from '@/lib/supabase/admin'

export type CohortSpotBanner = {
  hoursRemaining: number
  checkinsCompleted: number
  enrolledAt: string
} | null

/**
 * Dashboard banner: user has cohort participant status `applied`, fewer than 2 check-ins since enroll,
 * within the 48h compliance window (or overdue but not yet dropped by cron).
 */
export async function getCohortSecondCheckinBanner(authUserId: string): Promise<CohortSpotBanner> {
  const uid = String(authUserId || '').trim()
  if (!uid) return null

  const { data: prof, error: pErr } = await supabaseAdmin
    .from('profiles')
    .select('id, cohort_id')
    .eq('user_id', uid)
    .maybeSingle()
  if (pErr || !prof?.id) return null

  const cohortSlug = prof.cohort_id != null ? String(prof.cohort_id).trim() : ''
  const profileId = String(prof.id)
  if (!cohortSlug) return null

  const { data: cohort, error: cErr } = await supabaseAdmin
    .from('cohorts')
    .select('id')
    .eq('slug', cohortSlug)
    .maybeSingle()
  if (cErr || !cohort?.id) return null

  const { data: part, error: partErr } = await supabaseAdmin
    .from('cohort_participants')
    .select('id, status, enrolled_at')
    .eq('user_id', profileId)
    .eq('cohort_id', cohort.id)
    .maybeSingle()
  if (partErr || !part || String(part.status) !== 'applied') return null

  const enrolledIso = String(part.enrolled_at)
  const enrollYmd = enrolledIso.slice(0, 10)

  const [{ data: byCreated }, { data: byDate }] = await Promise.all([
    supabaseAdmin.from('daily_entries').select('user_id, local_date').eq('user_id', uid).gte('created_at', enrolledIso),
    supabaseAdmin.from('daily_entries').select('user_id, local_date').eq('user_id', uid).gte('local_date', enrollYmd),
  ])

  const dayKeys = new Set<string>()
  const add = (r: { user_id?: string | null; local_date?: string | null }) => {
    const u = r.user_id != null ? String(r.user_id).trim() : ''
    const ld = r.local_date != null ? String(r.local_date).slice(0, 10) : ''
    if (u && /^\d{4}-\d{2}-\d{2}$/.test(ld)) dayKeys.add(`${u}|${ld}`)
  }
  for (const r of byCreated || []) add(r as { user_id?: string | null; local_date?: string | null })
  for (const r of byDate || []) add(r as { user_id?: string | null; local_date?: string | null })
  const n = dayKeys.size
  if (n >= 2) return null

  const enrolledMs = new Date(enrolledIso).getTime()
  if (!Number.isFinite(enrolledMs)) return null
  const deadlineMs = enrolledMs + 48 * 60 * 60 * 1000
  const hoursRemaining = Math.max(0, Math.ceil((deadlineMs - Date.now()) / (60 * 60 * 1000)))

  return { hoursRemaining, checkinsCompleted: n, enrolledAt: enrolledIso }
}
