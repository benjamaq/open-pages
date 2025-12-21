import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    let { mood, energy, focus, stress, tags, supplement_intake } = body || {}

    if (typeof mood !== 'number' || typeof energy !== 'number' || typeof focus !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const clamp = (v: number) => Math.max(1, Math.min(5, Math.round(v)))
    mood = clamp(mood)
    energy = clamp(energy)
    focus = clamp(focus)

    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start.getTime())
    end.setDate(end.getDate() + 1)

    // Check for existing same-day record
    const { data: existing } = await supabase
      .from('checkin')
      .select('id, created_at')
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .maybeSingle()

    const payload: any = {
      user_id: user.id,
      mood,
      energy,
      focus,
      created_at: new Date().toISOString(),
      day: new Date().toISOString().split('T')[0],
    }
    if (typeof stress === 'string') {
      const s = String(stress).toLowerCase()
      if (['low', 'medium', 'high'].includes(s)) payload.stress_level = s
    }

    // Derive noise booleans from tags (for checkin row)
    try {
      const normalizedTags: string[] = Array.isArray(tags)
        ? (tags as any[]).map((t) => String(t).toLowerCase()).filter(Boolean)
        : []
      const finalTags = normalizedTags.includes('clean_day') ? [] : normalizedTags
      const has = (k: string) => finalTags.includes(k)
      payload.intense_exercise = !!has('intense_exercise')
      payload.new_supplement = !!has('new_supplement')
    } catch {}

    // Mirror/update daily_entries for this date (store tags, signals, supplement_intake) and collect micro-wins
    const microWins: string[] = []
    try {
      const localDate = new Date().toISOString().slice(0, 10)
      const normalizedTags: string[] = Array.isArray(tags)
        ? (tags as any[]).map((t) => String(t).toLowerCase()).filter(Boolean)
        : []
      // If "clean_day" present, prefer empty tags
      const finalTags = normalizedTags.includes('clean_day') ? [] : normalizedTags
      const intake =
        (supplement_intake && typeof supplement_intake === 'object')
          ? supplement_intake
          : null
      await supabase
        .from('daily_entries')
        .upsert(
          {
            user_id: user.id,
            local_date: localDate,
            mood,
            energy,
            focus,
            tags: finalTags.length > 0 ? finalTags : null,
            supplement_intake: intake
          },
          { onConflict: 'user_id,local_date' }
        )
      if (finalTags.length === 0) {
        microWins.push('✨ Clean day logged — signal strength improved')
      }
    } catch (e) {
      // non-fatal
      // eslint-disable-next-line no-console
      console.log('[checkin] daily_entries mirror failed', e)
    }

    // Update streak if profiles has columns; ignore if not present
    try {
      const todayStr = new Date().toISOString().slice(0,10)
      const yDate = new Date()
      yDate.setDate(yDate.getDate() - 1)
      const yesterdayStr = yDate.toISOString().slice(0,10)
      const { data: prof } = await supabase
        .from('profiles')
        .select('id,current_streak,last_checkin_date,first_activity_date')
        .eq('user_id', user.id)
        .maybeSingle()
      if (prof && (prof as any).id) {
        let currentStreak = Number((prof as any).current_streak || 0) || 0
        const lastDate: string | null = (prof as any).last_checkin_date || null
        if (lastDate === todayStr) {
          // already checked in today
        } else if (lastDate === yesterdayStr) {
          currentStreak += 1
          microWins.push(`🔥 Streak: ${currentStreak} day${currentStreak === 1 ? '' : 's'}! Consistent data = clearer results`)
        } else {
          currentStreak = 1
          microWins.push('🎉 First check-in of this streak! Your testing has begun.')
        }
        await supabase
          .from('profiles')
          .update({
            current_streak: currentStreak,
            last_checkin_date: todayStr,
            first_activity_date: (prof as any).first_activity_date || todayStr
          })
          .eq('id', (prof as any).id)
      }
    } catch (e) {}

    // Upsert by (user_id, day) so duplicate submissions update instead of insert
    // Debug log: attempt check-in upsert
    // eslint-disable-next-line no-console
    console.log('[checkin] upsert payload:', payload)
    const { data: upserted, error } = await supabase
      .from('checkin')
      .upsert(payload, { onConflict: 'user_id,day' })
      .select('id')
      .maybeSingle()
    // eslint-disable-next-line no-console
    console.log('[checkin] upsert result:', { ok: !error, id: upserted?.id, error })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id: upserted?.id, upserted: true, micro_wins: microWins })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
