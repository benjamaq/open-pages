import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Supplements (stack_items)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  let supplements: any[] = []
  if (profile?.id) {
    const { data: items } = await supabase
      .from('stack_items')
      .select('id, name, schedule_days')
      .eq('profile_id', profile.id)
      .eq('item_type', 'supplements')
    supplements = items || []
  }

  const { data: logs } = await supabase
    .from('supplement_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('local_date', { ascending: false })
    .limit(30)

  const { data: entries } = await supabase
    .from('daily_entries')
    .select('local_date, pain, sleep_quality, mood, lifestyle_factors')
    .eq('user_id', user.id)
    .order('local_date', { ascending: false })
    .limit(30)

  return NextResponse.json({
    user_id: user.id,
    supplements,
    total_logs: logs?.length || 0,
    sample_logs: (logs || []).slice(0, 10),
    entries_with_pain: (entries || []).filter((e: any) => e.pain !== null).length,
    sample_entries: (entries || []).slice(0, 10),
  })
}



