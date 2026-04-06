import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserContext } from '@/lib/types'
import { getYmdForUtcMsInTzOffset } from '@/lib/utils/localDateYmd'
import { dailyEntryIsExplicitUserCheckin } from '@/lib/explicitDailyCheckin'

function parseClientToday(url: URL): string | null {
  const lt = url.searchParams.get('localToday') || url.searchParams.get('clientToday')
  if (lt && /^\d{4}-\d{2}-\d{2}$/.test(lt)) return lt
  return null
}

function parseTzOffset(url: URL): number | null {
  const tz = url.searchParams.get('tzOffset')
  if (tz != null && /^-?\d+$/.test(tz)) return parseInt(tz, 10)
  return null
}

function ymdAddDays(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const x = new Date(Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + delta))
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, '0')}-${String(x.getUTCDate()).padStart(2, '0')}`
}

function buildCheckinDayKey(
  c: { created_at?: string; day?: unknown },
  tzOffsetMinutes: number | null,
): string {
  if (c?.day != null && String(c.day).trim() !== '') return String(c.day).slice(0, 10)
  const raw = c?.created_at
  if (raw) {
    try {
      const ms = Date.parse(String(raw))
      if (!Number.isFinite(ms)) return ''
      if (tzOffsetMinutes != null) return getYmdForUtcMsInTzOffset(ms, tzOffsetMinutes)
      return new Date(ms).toISOString().slice(0, 10)
    } catch {}
  }
  return ''
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const clientToday = parseClientToday(url)
    const tzOffset = parseTzOffset(url)
    const todayKey = clientToday || new Date().toISOString().slice(0, 10)
    const yesterdayKey = ymdAddDays(todayKey, -1)

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const getDayKey = (c: { created_at?: string; day?: unknown }) => buildCheckinDayKey(c, tzOffset)

    // Profile for first name + optional streak fields
    const { data: profile } = await supabase
      .from('app_user')
      .select('first_name, current_streak, longest_streak, health_priorities')
      .eq('id', user.id)
      .maybeSingle()

    const { data: checkinDays } = await supabase
      .from('checkin')
      .select('created_at,day,mood,energy,focus,stress_level,sleep_quality')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const distinctDays = new Set(
      ((checkinDays as any[] | null) || []).map((c: any) => getDayKey(c)).filter(Boolean),
    )
    const daysTracked = distinctDays.size
    const currentStreak = calculateStreak((checkinDays || []) as { created_at: string; day?: unknown }[], {
      todayKey,
      getDayKey,
    })
    const longestStreak = Math.max(((profile as any)?.longest_streak || 0), currentStreak)

    const lastCheckinAt = (() => {
      const first = ((checkinDays as any[] | null) || [])[0]
      const raw = first?.created_at ? String(first.created_at) : ''
      return raw || null
    })()
    const daysSinceLastCheckin = (() => {
      if (!lastCheckinAt) return null
      const lastYmd = getDayKey({ created_at: lastCheckinAt })
      if (!lastYmd) return null
      const lastMs = Date.parse(`${lastYmd}T00:00:00Z`)
      const todayMs = Date.parse(`${todayKey}T00:00:00Z`)
      if (!Number.isFinite(lastMs) || !Number.isFinite(todayMs)) return null
      return Math.max(0, Math.round((todayMs - lastMs) / 86400000))
    })()

    const EXPLICIT_SELECT =
      'local_date,mood,energy,focus,sleep_quality,mental_clarity,calmness,sleep_onset_bucket'

    const { data: entriesToday } = await supabase
      .from('daily_entries')
      .select(EXPLICIT_SELECT)
      .eq('user_id', user.id)
      .eq('local_date', todayKey)

    const { data: entriesYesterday } = await supabase
      .from('daily_entries')
      .select(EXPLICIT_SELECT)
      .eq('user_id', user.id)
      .eq('local_date', yesterdayKey)

    let hasCheckinToday = false
    for (const row of entriesToday || []) {
      if (dailyEntryIsExplicitUserCheckin(row as Record<string, unknown>)) {
        hasCheckinToday = true
        break
      }
    }
    if (!hasCheckinToday) {
      hasCheckinToday = ((checkinDays as any[] | null) || []).some((c: any) => getDayKey(c) === todayKey)
    }

    const pickExplicit = (rows: any[] | null) =>
      (rows || []).find((r) => dailyEntryIsExplicitUserCheckin(r as Record<string, unknown>)) || null

    const deToday = pickExplicit(entriesToday as any[] | null)
    const deYesterday = pickExplicit(entriesYesterday as any[] | null)

    let today: {
      mood?: unknown
      energy?: unknown
      focus?: unknown
      stress_level?: unknown
    } | null =
      deToday != null
        ? {
            mood: (deToday as any).mood,
            energy: (deToday as any).energy,
            focus: (deToday as any).focus,
          }
        : null
    let yesterday =
      deYesterday != null
        ? {
            mood: (deYesterday as any).mood,
            energy: (deYesterday as any).energy,
            focus: (deYesterday as any).focus,
          }
        : null

    if (!today) {
      const row = ((checkinDays as any[] | null) || []).find((c: any) => getDayKey(c) === todayKey)
      if (row) {
        today = {
          mood: (row as any).mood,
          energy: (row as any).energy,
          focus: (row as any).focus,
          stress_level: (row as any).stress_level,
        }
      }
    }
    if (!yesterday) {
      const row = ((checkinDays as any[] | null) || []).find((c: any) => getDayKey(c) === yesterdayKey)
      if (row) {
        yesterday = {
          mood: (row as any).mood,
          energy: (row as any).energy,
          focus: (row as any).focus,
        }
      }
    }

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
        .select('created_at,day')
        .eq('user_id', user.id)
        .gte('created_at', since.toISOString())
      const recentSet = new Set(
        ((recent as any[] | null) || []).map((r: any) => getDayKey(r)).filter(Boolean),
      )
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

    const microInsights: UserContext['microInsights'] = []

    const todayPublic: UserContext['today'] | undefined = today
      ? {
          mood: (today as any).mood,
          energy: (today as any).energy,
          focus: (today as any).focus,
          ...((today as any).stress_level != null
            ? { stress: String((today as any).stress_level) }
            : {}),
        }
      : undefined

    const context: UserContext & {
      hasWearableData?: boolean
      lastCheckinAt?: string | null
      daysSinceLastCheckin?: number | null
      hasEarlyPattern?: boolean
    } = {
      firstName: (profile as any)?.first_name || undefined,
      daysTracked,
      totalCheckins: (checkinDays || []).length,
      currentStreak,
      longestStreak,
      lastCheckinAt,
      daysSinceLastCheckin,
      hasCheckinToday,
      hasWearableData,
      activeTests,
      today: todayPublic,
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

function calculateStreak(
  checkins: Array<{ created_at: string; day?: unknown }>,
  opts: { todayKey: string; getDayKey: (c: { created_at: string; day?: unknown }) => string },
): number {
  if (!checkins?.length) return 0
  const set = new Set<string>(checkins.map((c) => opts.getDayKey(c)).filter(Boolean))
  const todayStr = opts.todayKey
  const yesterdayStr = ymdAddDays(todayStr, -1)

  let start = todayStr
  if (!set.has(todayStr)) {
    if (set.has(yesterdayStr)) start = yesterdayStr
    else return 0
  }

  let streak = 0
  let cursorYmd = start
  while (true) {
    if (set.has(cursorYmd)) {
      streak += 1
      cursorYmd = ymdAddDays(cursorYmd, -1)
    } else {
      break
    }
  }
  return streak
}
