import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Minimal Insights summary used by ElliCard and useInsights().
// Computes monthly spend and active count from user_supplement if present.
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prefer user_supplement (has cost + tags)
    const { data: us } = await supabase
      .from('user_supplement')
      .select('monthly_cost_usd, primary_goal_tags, primary_metric, name, is_active, user_id')
      .eq('user_id', user.id)
    const active = (us || []).filter((x: any) => x?.is_active !== false)
    const clamp = (n: any) => {
      const v = Number(n)
      if (!Number.isFinite(v)) return 0
      return Math.max(0, Math.min(80, v))
    }
    const monthlySpend = active.reduce((sum: number, r: any) => sum + clamp(r?.monthly_cost_usd), 0)
    const activeSuppCount = active.length

    // Build categorySpend from purposes/primary_goal_tags (fallbacks + heuristics)
    const totals: Record<string, number> = {}
    for (const row of active as any[]) {
      const tags: string[] =
        Array.isArray(row?.primary_goal_tags) && row.primary_goal_tags.length > 0
          ? row.primary_goal_tags
          : Array.isArray(row?.purposes) && row.purposes.length > 0
            ? row.purposes
            : (typeof row?.primary_metric === 'string' && row.primary_metric.trim()
                ? [row.primary_metric.trim()]
                : inferTagsFromName(String(row?.name || '')))

      const normalizedTags = (tags && tags.length > 0) ? tags.map(normalizePurpose) : ['other']
      const uniqueTags = Array.from(new Set(normalizedTags))
      const share = clamp(row?.monthly_cost_usd) / Math.max(1, uniqueTags.length)
      for (const t of uniqueTags) {
        totals[t] = (totals[t] || 0) + share
      }
    }
    const totalCost = Object.values(totals).reduce((a, b) => a + b, 0)
    const categorySpend = Object.entries(totals).map(([category, cost]) => ({
      category,
      monthlySpend: cost,
      percentage: totalCost ? Math.round((Number(cost) / totalCost) * 100) : 0
    }))

    // Count analyzed supplements from effect engine table
    const { data: effects } = await supabase
      .from('user_supplement_effect')
      .select('id')
      .eq('user_id', user.id)
    const testedSuppCount = (effects || []).length

    const payload = {
      monthlySpend,
      yearlySpend: Math.round(monthlySpend * 12),
      currency: 'USD',
      activeSuppCount,
      testedSuppCount,
      categorySpend,
      ingredientComposition: [],
      topCostDrivers: [],
      inferredGoals: categorySpend.map(c => ({ category: c.category, percentage: c.percentage })),
      monthlyTrend: [],
      nextBestInsight: null
    }
    return NextResponse.json(payload)
  } catch (e: any) {
    return NextResponse.json({
      monthlySpend: 0,
      yearlySpend: 0,
      currency: 'USD',
      activeSuppCount: 0,
      testedSuppCount: 0,
      categorySpend: [],
      ingredientComposition: [],
      topCostDrivers: [],
      inferredGoals: [],
      monthlyTrend: [],
      nextBestInsight: null
    })
  }
}

function inferTagsFromName(name: string): string[] {
  const n = name.toLowerCase()
  if (n.includes('creatine')) return ['energy']
  if (n.includes('magnesium')) return ['sleep']
  if (n.includes('omega')) return ['mood']
  if (n.includes('vitamin d')) return ['immunity']
  return []
}

function normalizePurpose(purpose: string): string {
  const p = purpose.toLowerCase().trim()
  if (p === 'sleep_quality' || p.includes('sleep')) return 'sleep'
  if (p.includes('energy') || p.includes('stamina')) return 'energy'
  if (p.includes('cognitive') || p.includes('focus')) return 'mood' // map cognitive to mood bucket for now
  if (p.includes('stress')) return 'stress'
  if (p.includes('mood')) return 'mood'
  if (p.includes('immunity')) return 'immunity'
  if (p.includes('athletic')) return 'athletic'
  if (p.includes('inflammation')) return 'inflammation'
  return 'other'
}
 
