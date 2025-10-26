import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeAndPersistInsights } from '@/app/actions/insights'

// POST /api/debug/integration/insights
// Triggers insights recompute and validates cooling/primary constraints
export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Run compute pipeline once
    const result = await computeAndPersistInsights(user.id)

    // Validate: within last 14 days, one primary at most and no duplicate keys
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 14)

    const { data: messages } = await supabase
      .from('elli_messages')
      .select('id, created_at, is_primary, context')
      .eq('user_id', user.id)
      .eq('message_type', 'insight')
      .gte('created_at', cutoff.toISOString())
      .order('created_at', { ascending: false })

    const recent = (messages || []) as any[]
    const primaryCount = recent.filter((m) => m.is_primary === true).length
    const keyCounts = new Map<string, number>()
    for (const m of recent) {
      const key = m?.context?.insightKey
      if (!key) continue
      keyCounts.set(key, (keyCounts.get(key) || 0) + 1)
    }
    const duplicates = Array.from(keyCounts.entries()).filter(([, c]) => c > 1)

    return NextResponse.json({
      success: true,
      compute: result,
      recentCount: recent.length,
      primaryCount,
      hasSinglePrimary: primaryCount <= 1,
      duplicateInsightKeys: duplicates,
      latest: recent[0] || null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


