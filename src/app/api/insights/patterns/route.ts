import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Join names and monthly_cost directly from stack_items
    const { data, error } = await supabase
      .from('pattern_insights')
      .select(`
        intervention_id,
        effect_size,
        confidence_score,
        sample_size,
        status,
        stack_items:intervention_id (
          id,
          name,
          monthly_cost
        )
      `)
      .eq('profile_id', (profile as any).id)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    type Row = {
      intervention_id: string
      effect_size: number | null
      confidence_score: number | null
      sample_size: number | null
      status: string | null
      stack_items: { id: string; name: string | null; monthly_cost: number | null } | null
    }

    // Map and filter obvious test entries
    const mapped = (data as Row[]).map((r) => {
      const name = (r.stack_items?.name || 'Supplement').trim()
      const effect = Number(r.effect_size || 0)
      const conf = Number(r.confidence_score || 0)
      const rawN = Number(r.sample_size ?? 0)
      const n = !isNaN(rawN) && rawN > 0 ? rawN : 30 // Fallback to 30 when sample_size is null/zero
      const direction = effect > 0 ? 'positive' : effect < 0 ? 'negative' : 'neutral'
      return {
        id: r.stack_items?.id || r.intervention_id,
        name,
        monthly_cost: r.stack_items?.monthly_cost ?? null,
        effect_size: isNaN(effect) ? 0 : effect,
        confidence_score: isNaN(conf) ? 0 : conf,
        sample_size: n,
        status: String(r.status || 'inconclusive'),
        direction
      }
    }).filter((row) => {
      const n = row.name.toLowerCase()
      if (row.name.length < 3) return false
      if (n.includes('test')) return false
      if (/^(.)\1+$/i.test(n)) return false // fff, aaa, xxx, etc.
      return true
    })

    // Dedupe by name: keep highest confidence_score (then larger |effect|)
    const byName = new Map<string, typeof mapped[number]>()
    for (const item of mapped) {
      const key = item.name.toLowerCase()
      const existing = byName.get(key)
      if (!existing) {
        byName.set(key, item)
      } else {
        const scoreA = (Number(existing.confidence_score) || 0) * 1000 + Math.abs(Number(existing.effect_size) || 0)
        const scoreB = (Number(item.confidence_score) || 0) * 1000 + Math.abs(Number(item.effect_size) || 0)
        if (scoreB > scoreA) byName.set(key, item)
      }
    }
    let results = Array.from(byName.values())

    // Sort: significant first; within significant, positive first by |effect| desc; inconclusive by name
    const statusRank = (s: string) => (String(s || '').toLowerCase() === 'significant' ? 0 : 1)
    results.sort((a, b) => {
      const ra = statusRank(a.status)
      const rb = statusRank(b.status)
      if (ra !== rb) return ra - rb
      if (ra === 0) {
        const da = a.direction === 'positive' ? 0 : a.direction === 'negative' ? 1 : 2
        const db = b.direction === 'positive' ? 0 : b.direction === 'negative' ? 1 : 2
        if (da !== db) return da - db
        const ma = Math.abs(a.effect_size || 0)
        const mb = Math.abs(b.effect_size || 0)
        if (ma !== mb) return mb - ma
        return (b.confidence_score || 0) - (a.confidence_score || 0)
      }
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json(results)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


