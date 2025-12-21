import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateElliCRIF, type ElliContext } from '@/lib/elli/crifEngine'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Load last 14 days of checkins
    const since = new Date()
    since.setDate(since.getDate() - 14)
    const { data: checkins } = await supabase
      .from('checkin')
      .select('day, mood, energy, focus')
      .eq('user_id', user.id)
      .gte('day', since.toISOString().slice(0, 10))
      .order('day', { ascending: false })

    // Basic streak calc
    let streak = 0
    let missedYesterday = false
    const today = new Date().toISOString().slice(0, 10)
    const daysSet = new Set((checkins || []).map(c => c.day))
    // walk back from today
    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      if (daysSet.has(key)) streak++
      else {
        if (i === 1) missedYesterday = true
        break
      }
    }

    const firstDay = (checkins || []).reduce<string | null>((acc, c: any) => {
      if (!acc) return c.day
      return c.day < acc ? c.day : acc
    }, null)
    const daysSinceFirstCheckin = firstDay ? Math.ceil((Date.now() - new Date(firstDay).getTime()) / (1000 * 60 * 60 * 24)) : 0
    const totalCheckins = (checkins || []).length

    function trend(vals: (number | null | undefined)[]) {
      const arr = vals.filter((v): v is number => typeof v === 'number')
      if (arr.length < 3) return 'flat' as const
      const recent = arr.slice(0, 3).reduce((a, b) => a + b, 0) / 3
      const prev = arr.slice(3, 6).reduce((a, b) => a + b, 0) / Math.max(arr.slice(3, 6).length, 1)
      if (recent > prev + 0.5) return 'up' as const
      if (recent < prev - 0.5) return 'down' as const
      return 'flat' as const
    }

    const moodTrend = trend((checkins || []).map((c: any) => c.mood))
    const energyTrend = trend((checkins || []).map((c: any) => c.energy))

    // Any early-signal supplements?
    const { data: supps } = await supabase
      .from('user_supplement')
      .select('stage')
      .eq('user_id', user.id)
      .eq('is_active', true)
    const hasAnyEarlySignalSupp = (supps || []).some((s: any) => (s.stage || '').toString().toLowerCase().includes('watch') || (s.stage || '').toString().toLowerCase().includes('early'))

    const daysUntilFirstMilestone = totalCheckins >= 7 ? 0 : Math.max(0, 7 - totalCheckins)

    const ctx: ElliContext = {
      streakDays: streak,
      missedYesterday,
      totalCheckins,
      daysSinceFirstCheckin,
      moodTrend,
      energyTrend,
      hasAnyEarlySignalSupp,
      daysUntilFirstMilestone
    }

    const crif = generateElliCRIF(ctx)
    return NextResponse.json({ crif, context: ctx })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}





