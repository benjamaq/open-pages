import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runCorrelationBatch } from '@/lib/insights/correlation-engine/batch-processor'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    // Fetch active users (heuristic: have entries in last 30d)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)

    const { data: recent } = await supabase
      .from('daily_entries')
      .select('user_id')
      .gte('local_date', cutoff.toISOString().split('T')[0])
      .limit(5000)

    const users = Array.from(new Set((recent || []).map((r: any) => r.user_id)))
    const results: any[] = []
    for (const userId of users) {
      try {
        const insights = await runCorrelationBatch(userId, 'low')
        results.push({ userId, insights: insights.length })
      } catch (e) {
        results.push({ userId, error: true })
      }
    }

    return NextResponse.json({ success: true, users: users.length, results })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


