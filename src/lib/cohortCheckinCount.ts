import { supabaseAdmin } from '@/lib/supabase/admin'

/** Distinct daily_entries count since enrollment (matches cohort-compliance cron logic). */
export async function countDistinctDailyEntriesSince(authUserId: string, enrolledIso: string): Promise<number> {
  const uid = String(authUserId || '').trim()
  if (!uid || !enrolledIso) return 0
  const enrollYmd = enrolledIso.slice(0, 10)
  const [{ data: byCreated }, { data: byDate }] = await Promise.all([
    supabaseAdmin.from('daily_entries').select('id').eq('user_id', uid).gte('created_at', enrolledIso),
    supabaseAdmin.from('daily_entries').select('id').eq('user_id', uid).gte('local_date', enrollYmd),
  ])
  const ids = new Set<string>()
  for (const r of byCreated || []) {
    if ((r as { id?: string })?.id) ids.add(String((r as { id: string }).id))
  }
  for (const r of byDate || []) {
    if ((r as { id?: string })?.id) ids.add(String((r as { id: string }).id))
  }
  return ids.size
}
