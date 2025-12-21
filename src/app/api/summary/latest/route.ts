import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today = new Date().toISOString().split('T')[0]

    // Has today check-in?
    const { data: todayCheckin } = await supabase
      .from('checkin')
      .select('*')
      .eq('user_id', user.id)
      .eq('day', today)
      .maybeSingle()

    if (!todayCheckin) {
      return NextResponse.json({
        insights: [],
        nextBestStep: 'Complete your daily check-in first',
        wins: {},
        updatedAt: new Date().toISOString(),
        requiresCheckIn: true
      })
    }

    // Recent insights
    const { data: insights } = await supabase
      .from('insight')
      .select('id,text,confidence,confidence_source,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Next Best Step via recommendation if exists, else compute once via RPC
    const { data: nextRec } = await supabase
      .from('recommendation')
      .select('rec, reason, action_payload')
      .eq('user_id', user.id)
      .is('acknowledged_at', null)
      .order('priority_score', { ascending: false })
      .limit(1)
      .maybeSingle()

    let nextBestStep = nextRec?.reason || 'Keep tracking daily check-ins for better insights'
    if (!nextRec) {
      const todayDate = new Date().toISOString().split('T')[0]
      const { data: rpc } = await supabase.rpc('get_next_best_step', { p_user_id: user.id, p_today: todayDate as any })
      if (rpc && (rpc as any[]).length > 0) {
        nextBestStep = (rpc as any[])[0].reason || nextBestStep
      }
    }

    // Placeholder wins (can compute later)
    const wins = {
      hrvChangePct: null,
      moneySaved: null,
      percentile: null
    }

    return NextResponse.json({
      insights: (insights || []).map((i: any) => ({
        id: i.id,
        text: i.text,
        confidence: i.confidence,
        confidenceSource: i.confidence_source,
        createdAt: i.created_at
      })),
      nextBestStep,
      wins,
      updatedAt: new Date().toISOString(),
      requiresCheckIn: false
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}






