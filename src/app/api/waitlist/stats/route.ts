import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

// GET /api/waitlist/stats - Get waitlist statistics
export async function GET() {
  try {
    const supabase = await createClient()

    // Get waitlist stats using the function
    const { data: stats, error } = await supabase
      .rpc('get_waitlist_stats')

    if (error) {
      console.error('Waitlist stats error:', error)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    // Get recent signups
    const { data: recentSignups, error: recentError } = await supabase
      .from('waitlist_signups')
      .select('email, created_at, status')
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentError) {
      console.error('Recent signups error:', recentError)
    }

    return NextResponse.json({
      stats: stats[0] || {
        total_signups: 0,
        pending_signups: 0,
        notified_signups: 0,
        converted_signups: 0
      },
      recentSignups: recentSignups || []
    })

  } catch (error) {
    console.error('Waitlist stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
