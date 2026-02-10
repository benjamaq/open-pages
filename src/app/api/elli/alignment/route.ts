import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { GoalCategory } from '@/types/insights'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Load user goals (table may or may not exist yet)
    let userGoals: GoalCategory[] = []
    try {
      const { data } = await supabase.from('user_goals').select('selected_goals').eq('user_id', user.id).maybeSingle()
      if ((data as any)?.selected_goals && Array.isArray((data as any).selected_goals)) userGoals = (data as any).selected_goals as GoalCategory[]
    } catch {}

    // Compute stack goals from active supplements primary_goal_tags
    const { data: supps } = await supabase
      .from('user_supplement')
      .select('primary_goal_tags, monthly_cost_usd, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)

    const totals: Record<string, number> = {}
    let total = 0
    for (const sAny of ((supps as any[] | null) || [])) {
      const s = sAny as any
      const category = ((Array.isArray(s.primary_goal_tags) && s.primary_goal_tags[0]) || 'other') as GoalCategory
      const cost = Number(s.monthly_cost_usd) || 0
      totals[category] = (totals[category] || 0) + cost
      total += cost
    }
    const stackGoals = Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([category, cost]) => ({ category: category as GoalCategory, percentage: total ? Math.round((cost / total) * 100) : 0 }))

    const topTwo = stackGoals.slice(0, 2).map(g => g.category)
    const overlap = userGoals.filter(g => topTwo.includes(g)).length
    let alignmentState: 'aligned' | 'mixed' | 'misaligned' = 'misaligned'
    if (overlap >= 1) alignmentState = 'mixed'
    if (overlap >= 1 && (stackGoals[0]?.percentage || 0) >= 35) alignmentState = 'aligned'
    const alignmentScore = Math.min(100, Math.round((overlap / Math.max(userGoals.length, 1)) * 100))

    return NextResponse.json({ userGoals, stackGoals, alignmentScore, alignmentState })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}





