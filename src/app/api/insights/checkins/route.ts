import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') // 'YYYY-MM'
    const now = new Date()
    const year = month ? Number(month.slice(0, 4)) : now.getFullYear()
    const mon = month ? Number(month.slice(5, 7)) - 1 : now.getMonth()
    const start = new Date(Date.UTC(year, mon, 1))
    const end = new Date(Date.UTC(year, mon + 1, 1))
    const startISO = start.toISOString().slice(0, 10)
    const endISO = end.toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('daily_entries')
      .select('local_date, mood, energy, focus')
      .eq('user_id', user.id)
      .gte('local_date', startISO)
      .lt('local_date', endISO)
      .order('local_date', { ascending: true })

    if (error) {
      console.error('Monthly checkins error:', error)
      return NextResponse.json([])
    }

    const rows = data || []
    return NextResponse.json(rows.map((r: any) => ({
      date: r.local_date,
      mood: r.mood ?? null,
      energy: r.energy ?? null,
      focus: r.focus ?? null
    })))
  } catch (e) {
    console.error('Monthly checkins unexpected error:', e)
    return NextResponse.json([])
  }
}


