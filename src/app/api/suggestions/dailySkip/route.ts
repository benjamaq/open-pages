import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSkipSuggestions, SupplementWithSignal } from '@/lib/analysis/skipSuggestions'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ suggestions: [] })

    // Load active supplements
    const { data: supps } = await supabase
      .from('user_supplement')
      .select('id,name,inferred_start_at,monthly_cost_usd,is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (!supps?.length) return NextResponse.json({ suggestions: [] })

    // Load effect rows to get days_on/off and categories if any
    const { data: effects } = await supabase
      .from('user_supplement_effect')
      .select('user_supplement_id,effect_category,days_on,days_off,clean_days')
      .eq('user_id', user.id)

    const effBySupp = new Map<string, any>()
    for (const e of effects || []) {
      effBySupp.set((e as any).user_supplement_id, e)
    }

    // Load processed clean days (for signal %)
    const since = new Date()
    since.setDate(since.getDate() - 365)
    const { data: dps } = await supabase
      .from('daily_processed_scores')
      .select('date,is_clean')
      .eq('user_id', user.id)
      .gte('date', since.toISOString().slice(0,10))

    const datesClean = new Set<string>((dps || []).filter(d => (d as any).is_clean).map(d => String((d as any).date)))

    // yesterday skip map
    const y = new Date()
    y.setDate(y.getDate() - 1)
    const yKey = y.toISOString().slice(0,10)
    const { data: yEntry } = await supabase
      .from('daily_entries')
      .select('supplement_intake')
      .eq('user_id', user.id)
      .eq('local_date', yKey)
      .maybeSingle()
    const yIntake: Record<string, string> = (yEntry as any)?.supplement_intake || {}

    const requiredCleanDays = 14
    const inputs: SupplementWithSignal[] = (supps || []).map(s => {
      const eff = effBySupp.get((s as any).id)
      const start = (s as any).inferred_start_at ? String((s as any).inferred_start_at).slice(0,10) : undefined
      let cleanCount = 0
      if (start) {
        // count clean days since start
        for (const d of datesClean) {
          if (d >= start) cleanCount++
        }
      } else {
        cleanCount = datesClean.size
      }
      const signalPercent = Math.min(100, Math.floor((cleanCount / requiredCleanDays) * 100))
      let status: SupplementWithSignal['status'] = 'building'
      const cat = eff?.effect_category as string | undefined
      if (signalPercent >= 100) {
        if (cat === 'works') status = 'ready'
        else if (cat === 'no_effect') status = 'no_signal'
        else if (cat === 'inconsistent') status = 'inconsistent'
        else status = 'needs_more_data'
      }
      return {
        id: (s as any).id,
        name: (s as any).name,
        daysOn: eff?.days_on ?? 0,
        daysOff: eff?.days_off ?? 0,
        signalPercent,
        status,
        startDate: start,
        skippedYesterday: yIntake[(s as any).id] === 'skipped',
        isDirty: false, // optional enhancement: compute from recent noise ratio
        requiredCleanDays
      }
    })

    const suggestions = getSkipSuggestions(inputs)
    return NextResponse.json({ suggestions })
  } catch (e: any) {
    return NextResponse.json({ suggestions: [], error: e?.message || 'Server error' }, { status: 500 })
  }
}


