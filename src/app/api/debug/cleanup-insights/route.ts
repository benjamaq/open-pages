import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Limit deletion to the current user's profile_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Delete obviously fake test rows:
  // effect_size=0.45 OR confidence_score=0.78 (note: stored as decimals 0..1)
  const { error } = await supabase
    .from('pattern_insights')
    .delete()
    .or('effect_size.eq.0.45,confidence_score.eq.0.78')
    .eq('profile_id', (profile as any).id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}


