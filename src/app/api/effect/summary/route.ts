import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('user_supplement_effect')
      .select('user_supplement_id,effect_category,effect_direction,effect_magnitude,effect_confidence,pre_start_average,post_start_average,days_on,days_off,clean_days,noisy_days,updated_at')
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Return a map keyed by user_supplement_id
    const map: Record<string, any> = {}
    for (const r of data || []) {
      map[(r as any).user_supplement_id] = r
    }
    return NextResponse.json({ effects: map })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


