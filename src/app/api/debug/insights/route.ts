import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Latest insights/messages
  const { data: messages, error: msgError } = await supabase
    .from('elli_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 })
  }

  // Latest entries for context
  const { data: entries } = await supabase
    .from('daily_entries')
    .select('local_date, pain, sleep_quality, mood, lifestyle_factors')
    .eq('user_id', user.id)
    .order('local_date', { ascending: false })
    .limit(30)

  return NextResponse.json({
    user_id: user.id,
    total_messages: messages?.length || 0,
    messages: (messages || []).map((m: any) => ({
      id: m.id,
      message_type: m.message_type,
      insight_key: m?.context?.insight_key,
      type: m?.context?.type,
      topLine: m?.context?.topLine,
      created_at: m.created_at,
    })),
    sample_entries: (entries || []).slice(0, 10),
    full_messages: messages,
  })
}



