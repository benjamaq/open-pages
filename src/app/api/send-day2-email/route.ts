import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendDay2TipsEmail } from '@/lib/email/resend'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve name from profile or fallback to email local-part
    let userName = ''
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .maybeSingle()
      userName = (profile?.display_name || '').trim().split(' ')[0] || ''
    } catch {}
    if (!userName) userName = (user.email || '').split('@')[0]

    const result = await sendDay2TipsEmail({ userEmail: user.email!, userName })
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to send' }, { status: 500 })
    }
    return NextResponse.json({ success: true, id: result.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


