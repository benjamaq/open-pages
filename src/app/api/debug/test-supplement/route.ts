import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeSupplementEffectiveness } from '@/lib/insights/computeSupplementEffectiveness'

export async function POST(request: NextRequest) {
  try {
    const { supplementName } = await request.json()
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: entries } = await supabase
      .from('daily_entries')
      .select('local_date, pain, skipped_supplements')
      .eq('user_id', user.id)
      .order('local_date', { ascending: true })
      .limit(30)

    if (!entries) {
      return NextResponse.json({ error: 'No entries found' }, { status: 404 })
    }

    const result = computeSupplementEffectiveness(supplementName, entries as any)

    return NextResponse.json({
      supplement: supplementName,
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


