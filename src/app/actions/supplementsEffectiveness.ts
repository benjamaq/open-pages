'use server'

import { createClient } from '@/lib/supabase/server'
import { saveElliMessage } from '@/lib/db/elliMessages'

type Entry = { local_date: string; pain: number }
type Log = { supplement_id: string; local_date: string; taken: boolean }

export async function computeAndPersistSupplementInsights(userId: string) {
  const supabase = await createClient()

  // Load last 60 days of pain entries
  const startDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const endDate = new Date().toISOString().split('T')[0]

  const [{ data: entries }, { data: logs }] = await Promise.all([
    supabase
      .from('daily_entries')
      .select('local_date, pain')
      .eq('user_id', userId)
      .gte('local_date', startDate)
      .lte('local_date', endDate)
      .order('local_date', { ascending: true }),
    supabase
      .from('supplement_logs')
      .select('supplement_id, local_date, taken')
      .eq('user_id', userId)
      .gte('local_date', startDate)
      .lte('local_date', endDate),
  ])

  if (!entries || !logs || entries.length === 0 || logs.length === 0) return { created: 0 }

  // Map date->pain
  const dateToPain = new Map<string, number>()
  ;(entries as Entry[]).forEach((e) => {
    if (typeof e.pain === 'number') dateToPain.set(e.local_date, e.pain)
  })

  // Group logs by supplement_id
  const supToLogs = new Map<string, Log[]>()
  ;(logs as Log[]).forEach((l) => {
    if (!supToLogs.has(l.supplement_id)) supToLogs.set(l.supplement_id, [])
    supToLogs.get(l.supplement_id)!.push(l)
  })

  // Get supplement metadata (from stack_items)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single()
  const profileId = (profile as any)?.id

  let idToName: Record<string, string> = {}
  let idToScheduleDays: Record<string, number[]> = {}
  if (profileId) {
    const { data: items } = await supabase
      .from('stack_items')
      .select('id, name, schedule_days')
      .eq('profile_id', profileId)
      .eq('item_type', 'supplements')
    idToName = Object.fromEntries((items || []).map((i: any) => [i.id, i.name]))
    idToScheduleDays = Object.fromEntries((items || []).map((i: any) => [i.id, i.schedule_days || []]))
  }

  const today = new Date().toISOString().split('T')[0]
  // Dedupe: remove only today's supplement effectiveness insights (do not delete other insights)
  await supabase
    .from('elli_messages')
    .delete()
    .eq('user_id', userId)
    .eq('message_type', 'insight')
    .filter('context->>insight_key', 'eq', 'supplement_effectiveness')
    .gte('created_at', `${today}T00:00:00Z`)

  let created = 0
  // Build full date list from entries
  const allDates = (entries as Entry[]).map((e) => e.local_date)

  // Evaluate each known supplement (from logs or from stack)
  const supplementIds = Array.from(new Set([
    ...Array.from(supToLogs.keys()),
    ...Object.keys(idToName || {})
  ]))

  // Thresholds for trustworthy supplement insights
  const MIN_TAKEN_DAYS = 7
  const MIN_NOT_TAKEN_DAYS = 7
  const MIN_TOTAL_DAYS = 14
  const MIN_IMPACT_POINTS = 2.0

  for (const supplementId of supplementIds) {
    const scheduleDays = idToScheduleDays[supplementId] || []
    const logsForSupp = supToLogs.get(supplementId) || []
    const logByDate = new Map<string, boolean>()
    logsForSupp.forEach((l) => logByDate.set(l.local_date, !!l.taken))

    // Collect pains for taken vs not-taken days where we have pain entries
    const takenPains: number[] = []
    const notTakenPains: number[] = []

    for (const dateStr of allDates) {
      const pain = dateToPain.get(dateStr)
      if (typeof pain !== 'number') continue
      // normalize taken: if a log exists use it; otherwise treat as scheduled
      const dateObj = new Date(dateStr + 'T00:00:00')
      const day = dateObj.getDay() // 0=Sun..6=Sat
      const scheduled = scheduleDays.includes(day)
      const taken = logByDate.has(dateStr) ? !!logByDate.get(dateStr) : scheduled
      if (taken) takenPains.push(pain)
      else notTakenPains.push(pain)
    }

    if (takenPains.length < MIN_TAKEN_DAYS || notTakenPains.length < MIN_NOT_TAKEN_DAYS) continue
    const total = takenPains.length + notTakenPains.length
    if (total < MIN_TOTAL_DAYS) continue

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
    const takenAvg = avg(takenPains)
    const notTakenAvg = avg(notTakenPains)
    const delta = notTakenAvg - takenAvg // positive delta means taken lowers pain (helps)

    if (Math.abs(delta) < MIN_IMPACT_POINTS) {
      // Unclear — skip to reduce noise
      continue
    }

    const name = idToName[supplementId] || 'This supplement'
    if (delta > 0) {
      // Seems to help
      const insight = {
        type: 'PATTERN DISCOVERED',
        topLine: `${name} seems to help`,
        discovery: `On days you take ${name}, your pain is usually around ${takenAvg.toFixed(0)} out of 10. On days you skip it, it's around ${notTakenAvg.toFixed(0)} out of 10.`,
        action: 'Keep taking it consistently for now; we will keep watching.',
        icon: '✅',
        insight_key: 'supplement_effectiveness',
        supplement_id: supplementId,
        priority: 4,
      }
      await saveElliMessage(userId, 'insight', `${insight.topLine}\n${insight.action}`, insight as any)
      created++
    } else {
      // Seems to worsen
      const insight = {
        type: 'WARNING',
        topLine: `${name} might be making pain worse`,
        discovery: `On days you take ${name}, your pain is usually around ${takenAvg.toFixed(0)} out of 10. On days you skip it, it's around ${notTakenAvg.toFixed(0)} out of 10.`,
        action: 'Consider pausing it for a week and see if pain improves. Talk to your clinician if needed.',
        icon: '⚠️',
        insight_key: 'supplement_effectiveness',
        supplement_id: supplementId,
        priority: 4,
      }
      await saveElliMessage(userId, 'insight', `${insight.topLine}\n${insight.action}`, insight as any)
      created++
    }
  }

  return { created }
}


