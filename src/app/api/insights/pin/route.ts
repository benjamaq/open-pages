import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { insightKey } = await request.json()
    if (!insightKey) return NextResponse.json({ error: 'Missing insightKey' }, { status: 400 })
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const expires = new Date()
    expires.setDate(expires.getDate() + 30)
    await supabase.from('user_insight_preferences').insert({
      user_id: user.id,
      insight_key: insightKey,
      action: 'pin',
      expires_at: expires.toISOString(),
    } as any)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


