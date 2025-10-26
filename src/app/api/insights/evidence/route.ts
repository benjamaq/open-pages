import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const insightKey = url.searchParams.get('insightKey')
    if (!insightKey) {
      return NextResponse.json({ error: 'Missing insightKey' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: messages } = await supabase
      .from('elli_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('message_type', 'insight')
      .order('created_at', { ascending: false })
      .limit(50)

    const found = (messages || []).find((m: any) => m?.context?.insightKey === insightKey)
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      insightKey,
      created_at: found.created_at,
      context: found.context,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


