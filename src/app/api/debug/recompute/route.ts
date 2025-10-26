import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeAndPersistInsights } from '@/app/actions/insights'
import { computeAndPersistSupplementInsights } from '@/app/actions/supplementsEffectiveness'
import { runCorrelationBatch } from '@/lib/insights/correlation-engine/batch-processor'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const url = new URL(request.url)

  // Allow unauthenticated access in development (requires ?userId=...)
  let userId: string | null = user?.id || null
  if (!userId) {
    userId = url.searchParams.get('userId')
    if (!userId && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (!userId && process.env.NODE_ENV === 'development') {
      return NextResponse.json({ error: 'Provide userId in dev via ?userId=' }, { status: 400 })
    }
  }

  try {
    const deep = url.searchParams.get('deep')
    const priority = (url.searchParams.get('priority') as any) || (deep ? 'low' : 'high')

    const result = await computeAndPersistInsights(userId as string)
    const supResult = await computeAndPersistSupplementInsights(userId as string)
    const batch = await runCorrelationBatch(userId as string, priority === 'low' ? 'low' : priority === 'normal' ? 'normal' : 'high')
    return NextResponse.json({
      success: true,
      insights_created: result.created,
      supplement_insights_created: supResult.created,
      batch_count: batch.length,
      batch_sample: batch.slice(0, 3),
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed' }, { status: 500 })
  }
}







