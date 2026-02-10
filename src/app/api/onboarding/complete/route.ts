import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { supplements } = body as { supplements?: Array<any> }
    if (!Array.isArray(supplements) || supplements.length === 0) {
      return NextResponse.json({ error: 'No supplements provided' }, { status: 400 })
    }

    // Preload products to compute monthly cost and map to canonical names
    const productIds = supplements.map((s: any) => s.productId).filter((id: any) => !!id)
    let productById: Record<string, any> = {}
    if (productIds.length > 0) {
      const { data: prods } = await supabase
        .from('product')
        .select(`
          id,
          price_per_container,
          servings_per_container,
          dose_per_serving_amount,
          canonical_supplement_id,
          canonical_supplement:canonical_supplement_id ( generic_name )
        `)
        .in('id', productIds)
      for (const p of ((prods || []) as Array<{ id: string }>)) productById[p.id] = p
    }

    // Ensure supplement rows exist (by canonical name or fallback to provided name)
    const canonicalNames = new Set<string>()
    for (const s of supplements) {
      let name: string | null = null
      const p = s.productId ? productById[s.productId] : null
      if (p?.canonical_supplement?.generic_name) name = String(p.canonical_supplement.generic_name)
      else if (typeof s.name === 'string' && s.name.trim()) name = s.name.trim()
      if (name) canonicalNames.add(name)
    }
    let canonicalNameToId: Record<string, string> = {}
    if (canonicalNames.size > 0) {
      const rows = Array.from(canonicalNames).map((n) => ({ canonical_name: n }))
      const sbAny = supabase as any
      const { data: supRows, error: supErr } = await sbAny
        .from('supplement')
        .upsert(rows, { onConflict: 'canonical_name' })
        .select('id, canonical_name')
      if (!supErr && Array.isArray(supRows)) {
        for (const r of supRows) canonicalNameToId[r.canonical_name] = r.id
      }
      // Fallback fetch in case of returning: minimal
      if (Object.keys(canonicalNameToId).length < canonicalNames.size) {
        const { data: fetched } = await supabase
          .from('supplement')
          .select('id, canonical_name')
          .in('canonical_name', Array.from(canonicalNames))
        for (const r of ((fetched || []) as Array<{ id: string; canonical_name: string }>)) {
          canonicalNameToId[r.canonical_name] = r.id
        }
      }
    }

    // Create user_supplement rows (mapped via supplement_id when possible)
    const supplementsToInsertRaw = supplements.map((s: any, idx: number) => {
      // Compute monthly cost if not provided, using product fallback
      let monthly = s.monthlyCost
      if ((monthly == null || Number.isNaN(Number(monthly))) && s.productId && productById[s.productId]) {
        const p = productById[s.productId]
        const price = Number(p.price_per_container)
        const servings = Number(p.servings_per_container)
        const dosePerServing = Number(p.dose_per_serving_amount) || 1
        const dailyDose = Number(s.dailyDose) || 1
        const daysPerWeek = Number(s.daysPerWeek) || 7
        if (price && servings) {
          const dailyCost = (price / servings) * (dailyDose / dosePerServing)
          monthly = Math.round(dailyCost * (daysPerWeek / 7) * 30 * 100) / 100
        }
      }
      // Clamp to a sane range (realistic display target for supplements)
      const mNum = Number(monthly)
      monthly = Number.isFinite(mNum) ? Math.max(0, Math.min(80, mNum)) : 0

      // Determine supplement_id
      let canonicalName: string | null = null
      const p = s.productId ? productById[s.productId] : null
      if (p?.canonical_supplement?.generic_name) canonicalName = String(p.canonical_supplement.generic_name)
      else if (typeof s.name === 'string' && s.name.trim()) canonicalName = s.name.trim()
      const supplementId = canonicalName ? canonicalNameToId[canonicalName] : undefined

      return {
        __idx: idx,
        supplement_id: supplementId,
        user_id: user.id,
        name: s.name,
        monthly_cost_usd: monthly,
        primary_goal_tags: Array.isArray(s.primaryGoals) ? s.primaryGoals : [],
        is_active: true
      }
    })

    // Guard: drop any entries that still have no supplement_id
    const supplementsToInsertFiltered = (supplementsToInsertRaw || []).filter((r) => !!r.supplement_id)

    // Deduplicate by (user_id, supplement_id) to avoid "ON CONFLICT ... cannot affect row a second time"
    const dedupMap = new Map<string, any>()
    for (const row of supplementsToInsertFiltered) {
      const key = `${row.user_id}:${row.supplement_id}`
      if (!dedupMap.has(key)) {
        dedupMap.set(key, row)
      } else {
        // Optional: prefer the row that has a defined monthly_cost_usd
        const existing = dedupMap.get(key)
        if ((existing?.monthly_cost_usd ?? null) == null && (row?.monthly_cost_usd ?? null) != null) {
          dedupMap.set(key, row)
        }
      }
    }
    const supplementsToInsert = Array.from(dedupMap.values())

    if (supplementsToInsert.length > 0) {
      const sbAny2 = supabase as any
      const { error: insertError } = await sbAny2
        .from('user_supplement')
        .upsert(supplementsToInsert.map(({ __idx, ...rest }) => rest), { onConflict: 'user_id,supplement_id' })
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

