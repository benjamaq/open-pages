import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeExerciseCorrelation, computeExerciseTypeCorrelation } from '@/lib/insights/computeExerciseCorrelation'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: entries } = await supabase
      .from('daily_entries')
      .select('local_date, pain, exercise_type, exercise_intensity, sleep_quality, mood')
      .eq('user_id', user.id)
      .order('local_date', { ascending: true })
      .limit(30)

    if (!entries) {
      return NextResponse.json({ error: 'No entries found' }, { status: 404 })
    }

    const overall = computeExerciseCorrelation(entries as any)
    const walking = computeExerciseTypeCorrelation('walking', entries as any)

    return NextResponse.json({
      overall,
      walking,
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


