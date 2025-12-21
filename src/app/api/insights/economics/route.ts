import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Resolve profile
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Fetch all stack items with monthly_cost
    const { data: items, error: iErr } = await supabase
      .from('stack_items')
      .select('id, monthly_cost')
      .eq('profile_id', (profile as any).id)
    if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 })

    // Fetch insights for direction/status
    const { data: insights, error: insErr } = await supabase
      .from('pattern_insights')
      .select('intervention_id, effect_size, status')
      .eq('profile_id', (profile as any).id)
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

    const map = new Map<string, { status: string; direction: 'positive' | 'negative' | 'neutral' }>()
    for (const r of insights || []) {
      const eff = Number((r as any).effect_size || 0)
      const dir = eff > 0 ? 'positive' : eff < 0 ? 'negative' : 'neutral'
      map.set((r as any).intervention_id, { status: String((r as any).status || 'inconclusive'), direction: dir })
    }

    const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
    let totalMonthlySpend = 0
    let verifiedSpend = 0
    let wastedSpend = 0
    let workingCount = 0
    let notWorkingCount = 0

    for (const it of items || []) {
      const id = (it as any).id as string
      const raw = Number((it as any).monthly_cost ?? 0)
      const monthly = isNaN(raw) ? 0 : clamp(raw, 0, 80)
      totalMonthlySpend += monthly
      const tag = map.get(id)
      const status = tag?.status?.toLowerCase() || 'inconclusive'
      const direction = tag?.direction || 'neutral'
      if (status === 'significant' && direction === 'positive') {
        verifiedSpend += monthly
        workingCount += 1
      } else {
        // Treat inconclusive and negative significant as "no effect detected / wasted"
        wastedSpend += monthly
        notWorkingCount += 1
      }
    }

    const result = {
      totalMonthlySpend,
      verifiedSpend,
      wastedSpend,
      potentialAnnualSavings: wastedSpend * 12,
      counts: {
        working: workingCount,
        notWorking: notWorkingCount,
        total: (items || []).length,
      }
    }

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


