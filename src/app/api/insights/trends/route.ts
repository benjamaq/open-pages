import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try daily_entries (preferred)
    const since = new Date()
    since.setDate(since.getDate() - 14)
    const sinceISO = since.toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('daily_entries')
      .select('local_date, mood, energy, focus, sleep_quality')
      .eq('user_id', user.id)
      .gte('local_date', sinceISO)
      .order('local_date', { ascending: true })

    if (error) {
      console.error('Trends fetch error:', error)
      return NextResponse.json({ mood: [], energy: [], focus: [], sleep: [] })
    }

    const rows = data || []
    const makeSeries = (key: string) => rows.map((r: any, i: number) => ({
      day: i,
      value: Number(r?.[key]) || 0
    }))

    return NextResponse.json({
      mood: makeSeries('mood'),
      energy: makeSeries('energy'),
      focus: makeSeries('focus'),
      sleep: makeSeries('sleep_quality')
    })
  } catch (e) {
    console.error('Trends API error:', e)
    return NextResponse.json({ mood: [], energy: [], focus: [], sleep: [] })
  }
}


