import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeAndPersistInsights } from '@/app/actions/insights'
import { computeAndPersistSupplementInsights } from '@/app/actions/supplementsEffectiveness'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  try {
    const result = await computeAndPersistInsights(user.id)
    const supResult = await computeAndPersistSupplementInsights(user.id)
    return NextResponse.json({
      success: true,
      insights_created: result.created,
      supplement_insights_created: supResult.created,
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed' }, { status: 500 })
  }
}




