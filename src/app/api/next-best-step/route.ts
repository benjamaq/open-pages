import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getButtonLabel(action: string): string {
  const labels: Record<string, string> = {
    checkin: 'Complete check-in',
    finish_active_test: 'View test progress',
    start_removal: 'Remove for 7 days',
    start_timing: 'Start timing test',
    start_dose: 'Start dose test',
    start_synergy: 'Test synergy',
  }
  return labels[action] || 'Do this'
}

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase.rpc(
      'get_next_best_step',
      {
        p_user_id: user.id,
        p_today: today as any
      } as any
    )

    if (error || !data || (data as any[]).length === 0) {
      return NextResponse.json({
        action: 'checkin',
        description: 'Keep tracking daily check-ins for better insights',
        buttonLabel: getButtonLabel('checkin')
      })
    }

    const rec = (data as any[])[0]
    return NextResponse.json({
      action: rec.rec,
      description: rec.reason,
      buttonLabel: getButtonLabel(rec.rec),
      metadata: rec.payload
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}






