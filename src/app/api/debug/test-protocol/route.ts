import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeProtocolEffectiveness } from '@/lib/insights/computeProtocolEffectiveness'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: entries } = await supabase
      .from('daily_entries')
      .select('local_date, pain, protocols, sleep_quality, mood')
      .eq('user_id', user.id)
      .order('local_date', { ascending: true })
      .limit(30)

    if (!entries) {
      return NextResponse.json({ error: 'No entries found' }, { status: 404 })
    }

    const protocol = { id: 'ice_bath', name: 'Ice baths', icon: '🧊' } as const
    const result = computeProtocolEffectiveness(protocol as any, entries as any)

    return NextResponse.json({
      protocol: protocol.id,
      result,
      entryCount: entries.length,
      sampleEntry: entries[0]
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}


