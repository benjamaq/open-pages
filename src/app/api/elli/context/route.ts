import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserContext } from '@/lib/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Profile for first name + optional streak fields
    const { data: profile } = await supabase
      .from('app_user')
      .select('first_name, current_streak, longest_streak, health_priorities')
      .eq('id', user.id)
      .maybeSingle()

    // Distinct days and total checkins
    const { data: checkinDays } = await supabase
      .from('checkin')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const distinctDays = new Set(((checkinDays as any[] | null) || []).map((c: any) => new Date(c.created_at).toISOString().slice(0, 10)))
    const daysTracked = distinctDays.size
    const currentStreak = calculateStreak(checkinDays || [])
    const longestStreak = Math.max(((profile as any)?.longest_streak || 0), currentStreak)

    // Today / yesterday
    const todayStr = new Date().toISOString().slice(0, 10)
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const { data: today } = await supabase
      .from('checkin')
      .select('mood, energy, focus, stress_level')
      .eq('user_id', user.id)
      .gte('created_at', `${todayStr}T00:00:00`)
      .lte('created_at', `${todayStr}T23:59:59`)
      .maybeSingle()
    const { data: yesterday } = await supabase
      .from('checkin')
      .select('mood, energy, focus')
      .eq('user_id', user.id)
      .gte('created_at', `${yesterdayStr}T00:00:00`)
      .lte('created_at', `${yesterdayStr}T23:59:59`)
      .maybeSingle()

    // Active supplements
    const { data: supplements } = await supabase
      .from('user_supplement')
      .select('id, name, stage, primary_goal_tags, primary_metric')
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Has wearable data? (any daily_entries row)
    let hasWearableData = false
    try {
      const { data: oneDE } = await supabase
        .from('daily_entries')
        .select('local_date')
        .eq('user_id', user.id)
        .limit(1)
      hasWearableData = Array.isArray(oneDE) && oneDE.length > 0
    } catch {}

    // Build active tests (7-day target)
    const activeTests: UserContext['activeTests'] = []
    if (supplements && supplements.length > 0) {
      const since = new Date()
      since.setDate(since.getDate() - 14)
      const { data: recent } = await supabase
        .from('checkin')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', since.toISOString())
      const recentSet = new Set(((recent as any[] | null) || []).map((r: any) => new Date(r.created_at).toISOString().slice(0, 10)))
      const daysCompleted = recentSet.size
      for (const s of supplements) {
        const stage = (s as any).stage || 'hypothesis'
        if (['hypothesis', 'early_signal', 'validating'].includes(stage) && daysCompleted < 7) {
          activeTests.push({
            supplementId: (s as any).id,
            name: (s as any).name || 'Supplement',
            primaryGoal: ((s as any).primary_goal_tags || [])[0] || 'wellness',
            daysCompleted,
            targetDays: 7
          })
        }
      }
    }

    // New truth reports not yet viewed
    let newTruthReports: { supplementId: string; name: string }[] = []
    try {
      const { data: truthReports } = await supabase
        .from('supplement_truth_reports')
        .select('user_supplement_id, created_at')
        .in('user_supplement_id', ((supplements as any[] | null) || []).map((s: any) => s.id) || [])
        .is('viewed_at', null)
      newTruthReports = ((truthReports as any[] | null) || []).map((tr: any) => {
        const supp = ((supplements as any[] | null) || []).find((s: any) => s.id === tr.user_supplement_id)
        return { supplementId: tr.user_supplement_id, name: (supp as any)?.name || 'Supplement' }
      })
    } catch {}

    // Micro-insights disabled in clinical version (compute elsewhere if needed)
    const microInsights: UserContext['microInsights'] = []

    const todayOverride: any = today ? { today: { ...(today as any), stress: (today as any).stress_level } } : {}
    const context: UserContext & { hasWearableData?: boolean } = {
      firstName: (profile as any)?.first_name || undefined,
      daysTracked,
      totalCheckins: (checkinDays || []).length,
      currentStreak,
      longestStreak,
      hasCheckinToday: !!today,
      hasWearableData,
      activeTests,
      today: today || undefined,
      // map stress_level -> today.stress
      ...todayOverride,
      yesterday: yesterday || undefined,
      hasNewTruthReport: newTruthReports.length > 0,
      newTruthReports,
      hasEarlyPattern: microInsights.length > 0,
      microInsights,
      priorities: (profile as any)?.health_priorities || undefined
    }

    return NextResponse.json(context, { headers: { 'Cache-Control': 'private, max-age=60' } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

function calculateStreak(checkins: Array<{ created_at: string }>): number {
  if (!checkins?.length) return 0
  const set = new Set<string>(
    checkins.map((c) => new Date(c.created_at).toISOString().split('T')[0])
  )
  const todayStr = new Date().toISOString().split('T')[0]
  const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  let start = todayStr
  if (!set.has(todayStr)) {
    if (set.has(yesterdayStr)) start = yesterdayStr
    else return 0
  }

  let streak = 0
  let cursor = new Date(start)
  while (true) {
    const key = cursor.toISOString().split('T')[0]
    if (set.has(key)) {
      streak += 1
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000)
    } else {
      break
    }
  }
  return streak
}


