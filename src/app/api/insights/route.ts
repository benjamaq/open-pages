import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const limitParam = url.searchParams.get('limit')
    const limit = Math.min(parseInt(limitParam || '10', 10) || 10, 50)

    const { data, error: dbError } = await supabase
      .from('elli_messages')
      .select('id, created_at, context, is_primary')
      .eq('user_id', user.id)
      .eq('message_type', 'insight')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (dbError) {
      console.error('[api/insights] Error:', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ insights: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}



