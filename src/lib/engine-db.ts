'use server'

import { createClient } from '@/lib/supabase/server'
import type { DayPoint } from './engine'

export async function getWindowDays(
  supplementId: string,
  window: '30d'|'90d'|'365d',
  userId?: string,
  metric: 'mood' | 'sleep_quality' = 'mood'
): Promise<{ rows: DayPoint[]; debug: { dailyEntriesCount?: number; supplementLogsCount?: number; matchedCount?: number; treatedCount: number; controlCount: number; periodsCount: number; takenDatesSize?: number; checkinsCount?: number } }> {
  console.log('🚨🚨🚨 getWindowDays CALLED', { supplementId, window, userId, metric })
  console.error('🚨 getWindowDays params', { supplementId, window, userId, metric })
  const supabase = await createClient()
  try {
    console.log('🔍 getWindowDays called', { supplementId, window, userId: userId ?? null, metric })
  } catch {}
  const days = window === '30d' ? 30 : window === '90d' ? 90 : 365
  // sinceISO will be set after we determine the correct anchor date (historical-aware)
  let sinceISO = ''
  let anchorISO = new Date().toISOString().slice(0, 10)
  try {
    console.log('📅 Initial anchor (today):', anchorISO)
  } catch {}

  // Fetch periods for supplement (fallback treatment if logs missing)
  const { data: periods } = await supabase
    .from('intervention_periods')
    .select('start_date, end_date, intervention_id')
    .eq('intervention_id', supplementId)
  console.log('📊 Periods:', (periods || []).length)

  // Support two data pipelines: mood (checkins) and sleep_quality (daily_entries + supplement_logs)
  if (metric === 'sleep_quality' || metric === 'energy' || metric === 'focus') {
    // Outcome: daily_entries.sleep_quality
    try {
      console.log('🧪 Query daily_entries', { table: 'daily_entries', where: { user_id: userId ?? '(any)', gte_local_date: '(computed after anchor)' } })
    } catch {}
    // We'll compute sinceISO after we figure out anchorISO for this supplement/user
    let qSleep = supabase
      .from('daily_entries')
      .select('local_date,sleep_quality,energy,focus')
      .order('local_date', { ascending: true }) as any
    if (userId) qSleep = qSleep.eq('user_id', userId)
    const { data: entriesAll, error: sleepErr } = await qSleep
    // Determine anchor and since using actual data
    // 1) Try most recent supplement_log date for this supplement (after mapping below)
    // 2) Fallback: most recent daily_entry date for this user
    // Compute after mapping supplementProfileId below
    console.log('🛌 Sleep entries (all):', { count: (entriesAll || []).length, error: sleepErr || null, sample: (entriesAll || [])[0] || null })

    // Treatment: supplement_logs.taken or fallback to periods
    let takenDates = new Set<string>()
    let logsCount = 0
    let matchedCount = 0
    let supplementProfileId: string | null = null
    let stackItemName: string | null = null
    let profileName: string | null = null
    let mostRecentLogDate: string | null = null
    // Windowed entries holder (must be visible outside try scope)
    let entries: any[] = []
    try {
      // Resolve stack item name
      const { data: stackItem } = await supabase
        .from('stack_items')
        .select('name')
        .eq('id', supplementId)
        .maybeSingle()
      stackItemName = (stackItem as any)?.name || null
      // Resolve supplement_profiles.id by name (exact then fuzzy)
      if (stackItemName) {
        const { data: profExact } = await supabase
          .from('supplement_profiles')
          .select('id,name')
          .eq('name', stackItemName)
          .maybeSingle()
        supplementProfileId = (profExact as any)?.id || null
        profileName = (profExact as any)?.name || null
        // If no exact match, attempt first-word exact match (avoid over-broad fuzzy)
        if (!supplementProfileId) {
          const firstWord = stackItemName.split(/\s+/)[0]
          if (firstWord) {
            const { data: profFirst } = await supabase
              .from('supplement_profiles')
              .select('id,name')
              .eq('name', firstWord)
              .maybeSingle()
            supplementProfileId = (profFirst as any)?.id || null
            profileName = (profFirst as any)?.name || null
          }
        }
      }
      console.log('🧭 Stack→Profile mapping', { stackItemName, supplementProfileId, profileName })
      // Find most recent log date for this supplement if we have a profile ID
      if (supplementProfileId) {
        const { data: lastLog } = await supabase
          .from('supplement_logs')
          .select('local_date')
          .eq('user_id', userId as any)
          .eq('supplement_id', supplementProfileId)
          .order('local_date', { ascending: false })
          .limit(1)
          .maybeSingle()
        mostRecentLogDate = (lastLog as any)?.local_date || null
      }
      // Determine anchor and since
      if (mostRecentLogDate) {
        anchorISO = mostRecentLogDate
      } else if ((entriesAll || []).length > 0) {
        // use most recent daily entry as anchor
        anchorISO = (entriesAll as any[])[(entriesAll as any[]).length - 1].local_date
      }
      const anchorDateObj = new Date(anchorISO)
      const sinceDateObj = new Date(anchorDateObj)
      sinceDateObj.setDate(anchorDateObj.getDate() - (days - 1))
      sinceISO = sinceDateObj.toISOString().slice(0, 10)
      console.log('📅 Computed anchor:', anchorISO, '| since:', sinceISO, '| windowDays:', days)
      // Now filter entries into window
      entries = (entriesAll || []).filter((e: any) => e.local_date >= sinceISO && e.local_date <= anchorISO)
      console.log('🛌 Sleep entries (window):', { count: entries.length, sample: entries[0] || null })
      // Query supplement_logs within window (only if we have a mapped profile id)
      console.log('🧪 Query supplement_logs', { table: 'supplement_logs', where: { user_id: userId ?? '(any)', gte_local_date: sinceISO, lte_local_date: anchorISO, supplement_id: supplementProfileId ?? '(skip)' } })
      let qLogs = supabase
        .from('supplement_logs')
        .select('local_date,taken,supplement_id')
        .gte('local_date', sinceISO)
        .lte('local_date', anchorISO) as any
      if (userId) qLogs = qLogs.eq('user_id', userId)
      if (supplementProfileId) qLogs = qLogs.eq('supplement_id', supplementProfileId)
      // Try matching by stack_item_id first
      const { data: logs, error: logsErr } = await qLogs
      logsCount = (logs || []).length
      console.log('📥 supplement_logs result:', { count: logsCount, error: logsErr || null, sample: (logs || [])[0] || null })
      // If filtered by supplement_id, all logs are considered matched
      matchedCount = logsCount
      if ((logs || []).length > 0) {
        for (const l of logs as any[]) if ((l as any).taken) takenDates.add((l as any).local_date as string)
        console.log('✅ takenDates (via logs) size:', takenDates.size)
      } else {
        console.log('ℹ️ No matching supplement_logs by supplement_profiles.id; trying fallback match by stack_items.id')
        // Fallback: some setups store stack_items.id directly in supplement_logs.supplement_id
        let qLogsByStack = supabase
          .from('supplement_logs')
          .select('local_date,taken,supplement_id')
          .gte('local_date', sinceISO)
          .lte('local_date', anchorISO) as any
        if (userId) qLogsByStack = qLogsByStack.eq('user_id', userId)
        // Use the original stack item id as supplement_id fallback
        qLogsByStack = qLogsByStack.eq('supplement_id', supplementId)
        const { data: logs2, error: logsErr2 } = await qLogsByStack
        const logs2Count = (logs2 || []).length
        console.log('📥 supplement_logs (fallback by stack_items.id) result:', { count: logs2Count, error: logsErr2 || null, sample: (logs2 || [])[0] || null })
        if (logs2Count > 0) {
          logsCount = logs2Count
          matchedCount = logs2Count
          for (const l of logs2 as any[]) if ((l as any).taken) takenDates.add((l as any).local_date as string)
          console.log('✅ takenDates (via fallback logs) size:', takenDates.size)
        } else {
          console.log('ℹ️ No supplement_logs found by either profile mapping or stack id; falling back to intervention_periods for treatment')
        }
      }
    } catch (e) {
      console.log('ℹ️ supplement_logs unavailable; using periods fallback')
    }

    const isTreatedByPeriods = (date: string) => {
      for (const p of (periods || []) as any[]) {
        if (date >= p.start_date && (!p.end_date || date <= p.end_date)) return true
      }
      return false
    }

    const rows: DayPoint[] = []
    let treatedCount = 0
    let controlCount = 0
    // Build day sequence from sinceISO → anchorISO
    const dayStrings: string[] = []
    {
      const start = new Date(sinceISO)
      const end = new Date(anchorISO)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dayStrings.push(d.toISOString().slice(0, 10))
      }
      // Ensure at most 'days' entries
      while (dayStrings.length > days) {
        dayStrings.shift()
      }
    }
    for (const dateStr of dayStrings) {
      const entry = entries.find((e: any) => e.local_date === dateStr)
      const sleep = entry?.sleep_quality as number | undefined
      const energyVal = entry?.energy as number | undefined
      const focusVal = entry?.focus as number | undefined
      // Select metric value
      const val = metric === 'sleep_quality' ? sleep : metric === 'energy' ? energyVal : focusVal
      // Map numeric (1-3 or 1-10) to buckets for mood fallback copy only
      const mood =
        val == null ? null :
        (metric === 'sleep_quality'
          ? (val <= 33 ? 'low' : val <= 66 ? 'ok' : 'sharp')
          : (val <= 1 ? 'low' : val === 2 ? 'ok' : 'sharp'))
      const treated = takenDates.size > 0
        ? takenDates.has(dateStr)
        : isTreatedByPeriods(dateStr)
      if (treated) treatedCount++; else controlCount++;
      rows.push({ date: dateStr, treated, mood: mood as any, sleep_score: sleep ?? null, metric_value: val ?? null } as any)
    }
    console.log('  → Built', rows.length, 'rows (sleep_quality)')
    console.log('  → Distribution:', { treated: treatedCount, control: controlCount, takenDatesSize: takenDates.size, periodsCount: (periods || []).length })
    return {
      rows: rows.reverse(),
      debug: {
        dailyEntriesCount: entries.length,
        supplementLogsCount: logsCount,
        matchedCount,
        treatedCount,
        controlCount,
        periodsCount: (periods || []).length,
        takenDatesSize: takenDates.size
      }
    }
  }

  // Default mood path (checkins)
  try {
    console.log('🧪 Query checkins', { table: 'checkins', where: { user_id: userId ?? '(any)', gte_date: sinceISO } })
  } catch {}
  let query = supabase
    .from('checkins')
    .select('date, mood')
    .gte('date', sinceISO)
    .order('date', { ascending: true }) as any
  if (userId) query = query.eq('user_id', userId)
  const { data: checkins, error } = await query
  console.log('🔍 Querying check-ins with userId:', userId ?? null)
  console.log('✅ Check-ins query result:', { count: (checkins || []).length, error: error || null, sample: (checkins || [])[0] || null })
  if (error || !checkins || checkins.length === 0) {
    console.log('  → No check-ins found')
    return { rows: [], debug: { checkinsCount: 0, treatedCount: 0, controlCount: 0, periodsCount: (periods || []).length } }
  }

  // Build date->mood map
  const dateMap = new Map<string, 'low' | 'ok' | 'sharp'>()
  for (const c of checkins) {
    const mood = (c as any).mood as 'low' | 'ok' | 'sharp'
    if (mood === 'low' || mood === 'ok' || mood === 'sharp') {
      dateMap.set((c as any).date as string, mood)
    }
  }

  // Helper to check if a date is within any treatment period
  const isTreated = (date: string, ps: Array<{ start_date: string; end_date: string | null }>) => {
    for (const p of ps || []) {
      if (date >= p.start_date && (!p.end_date || date <= p.end_date)) return true
    }
    return false
  }

  // Build continuous rows for each day in the window
  const rows: DayPoint[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 864e5)
    const dateStr = d.toISOString().slice(0, 10)
    const mood = dateMap.get(dateStr) ?? null
    const treated = isTreated(dateStr, (periods || []) as any)
    rows.push({ date: dateStr, treated, mood: mood as any })
  }
  console.log('  → Built', rows.length, 'rows')

  // compute treated/control counts for debug in mood path
  const treatedCount = rows.filter(r => r.treated).length
  const controlCount = rows.length - treatedCount
  return { rows: rows.reverse(), debug: { checkinsCount: (checkins || []).length, treatedCount, controlCount, periodsCount: (periods || []).length } }
}


