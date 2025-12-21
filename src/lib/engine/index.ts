'use server'

import { finalizeSnapshot } from './compose'
import type { SignalSnapshot, DayRow } from './types'
import { getWindowDays } from '../engine-db'
import { createClient } from '@/lib/supabase/server'

// Back-compat helper: compute only from supplement periods + daily entries
export async function computeSignalForSupplement(
  supplementId: string,
  window: '30d' | '90d' | '365d' = '30d',
  metric: 'mood' | 'sleep_quality' = 'sleep_quality'
): Promise<SignalSnapshot> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Resolve profile id if possible
  let profileId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    profileId = (profile as any)?.id ?? null
  }
  // Resolve supplement name
  const { data: item } = await supabase
    .from('stack_items')
    .select('name')
    .eq('id', supplementId)
    .maybeSingle()
  const supplementName = (item as any)?.name ?? 'Supplement'

  const windowData = await getWindowDays(supplementId, window, user?.id ?? undefined, metric) as any
  const baseRows = Array.isArray(windowData) ? windowData : windowData.rows
  const rows: DayRow[] = baseRows.map((d: any) => ({
    date: d.date,
    treated: d.treated,
    mood: d.mood as any,
    sleep_score: typeof d.sleep_score === 'number' ? d.sleep_score : d.sleep_score ?? null
  }))
  return finalizeSnapshot(rows, window, supplementId, supplementName, profileId ?? '', user?.id ?? '')
}

// Preferred API: includes userId for future differentiation, currently forwarded
export async function computeSignal(
  userId: string,
  supplementId: string,
  window: '30d' | '90d' | '365d' = '30d',
  metric: 'mood' | 'sleep_quality' = 'sleep_quality'
): Promise<SignalSnapshot> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  const profileId = (profile as any)?.id ?? ''

  const { data: item } = await supabase
    .from('stack_items')
    .select('name')
    .eq('id', supplementId)
    .maybeSingle()
  const supplementName = (item as any)?.name ?? 'Supplement'

  const windowData = await getWindowDays(supplementId, window, userId, metric) as any
  const baseRows = Array.isArray(windowData) ? windowData : windowData.rows
  const rows: DayRow[] = baseRows.map((d: any) => ({
    date: d.date,
    treated: d.treated,
    mood: d.mood as any,
    sleep_score: typeof d.sleep_score === 'number' ? d.sleep_score : d.sleep_score ?? null
  }))
  return finalizeSnapshot(rows, window, supplementId, supplementName, profileId, userId)
}

