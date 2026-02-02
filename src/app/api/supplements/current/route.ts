import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/supplements/current
 * Source of truth = user_supplement (current stack). Enrich with stack_items (dose/timing/brand) by name normalization.
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  try {
    const url = new URL(req.url)
    const debug = url.search.params?.get
      ? (url.search.params.get('debug') === '1')
      : (new URLSearchParams(url.search).get('debug') === '1')
    if (debug) {
      // eslint-disable-next-line no-console
      console.log('=== GET /api/supplements/current?debug=1 ===')
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch current stack rows
    const { data: us, error: usErr } = await supabase
      .from('user_supplement')
      .select('id,user_id,is_active,created_at,name,label,monthly_cost_usd,dose,timing,brand,inferred_start_at,retest_started_at,started_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (usErr) return NextResponse.json({ error: usErr.message }, { status: 500 })
    let rows: any[] = us || []
    if (debug) {
      // eslint-disable-next-line no-console
      console.log('[current] user_supplement count:', rows.length)
      console.log('[current] user_supplement sample:', rows.slice(0, 5))
    }

    // Find profile to fetch stack_items
    let profileId: string | null = null
    try {
      const { data: p } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      profileId = (p as any)?.id ?? null
    } catch {}
    if (!profileId) {
      const { data: ap } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      profileId = (ap as any)?.id ?? null
    }

    // Enrich with stack_items when available
    if (profileId) {
      const { data: si } = await supabaseAdmin
        .from('stack_items')
        .select('id,name,monthly_cost,dose,timing,brand,notes,frequency,start_date')
        .eq('profile_id', profileId)
      const stackItems = si || []
      if (debug) {
        // eslint-disable-next-line no-console
        console.log('[current] stack_items count:', stackItems.length)
        console.log('[current] stack_items sample:', stackItems.slice(0, 5))
      }

      const normalize = (raw?: string | null) => {
        const s = String(raw || '').toLowerCase()
        const parts = s.split(',').map((p) => p.trim()).filter(Boolean)
        const base = parts.length >= 2 ? parts[1] : parts[0] || s
        return base
          .replace(/\b\d+\s?(mcg|mg|g|iu|ml|tbsp|caps?|capsules?|tabs?|tablets?|gummies|softgels?|pack(et)?|count|ct|servings?|dose|x)\b/gi, '')
          .replace(/[^a-z0-9]+/g, ' ')
          .trim()
      }
      const siByKey = new Map<string, any>()
      for (const item of stackItems) {
        const key = normalize(item?.name)
        if (key && !siByKey.has(key)) siByKey.set(key, item)
      }
      rows = rows.map((r: any) => {
        const key = normalize(r?.name || r?.label)
        const match = key ? siByKey.get(key) : undefined
        const monthlyRaw = Number(r?.monthly_cost_usd)
        const monthly_cost_usd = Number.isFinite(monthlyRaw) && monthlyRaw > 0
          ? monthlyRaw
          : (() => {
              const mc = Number(match?.monthly_cost)
              return Number.isFinite(mc) && mc > 0 ? Math.max(0, Math.min(1000, mc)) : (monthlyRaw || 0)
            })()
        // Choose the canonical started_at for clients:
        // 1) retest_started_at (active retest window)
        // 2) inferred_start_at (backfilled historical start)
        // 3) stack_items.start_date (UI-managed)
        // 4) created_at (fallback)
        const started_at =
          (r as any)?.retest_started_at
          || (r as any)?.inferred_start_at
          || (match as any)?.start_date
          || (r as any)?.created_at
        return {
          ...r,
          monthly_cost_usd,
          dose: r?.dose ?? match?.dose ?? null,
          timing: r?.timing ?? match?.timing ?? null,
          brand: r?.brand ?? match?.brand ?? null,
          notes: r?.notes ?? match?.notes ?? null,
          frequency: (r as any)?.frequency ?? match?.frequency ?? null,
          started_at,
        }
      })
    }

    // Final normalization
    const normalized = rows.map((row) => {
      const rawMonthly = Number((row as any)?.monthly_cost_usd)
      const monthly_cost_usd = Number.isFinite(rawMonthly) ? Math.max(0, Math.min(1000, rawMonthly)) : 0
      return { ...row, monthly_cost_usd }
    })

    if (debug) {
      // eslint-disable-next-line no-console
      console.log('[current] normalized sample:', normalized.slice(0, 5))
      try {
        console.log('[current] monthly_cost_usd list:',
          normalized.map((r: any) => ({
            id: r.id,
            name: r.name,
            monthly_cost_usd: r.monthly_cost_usd
          }))
        )
      } catch {}
    }
    return NextResponse.json(normalized)
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('GET /api/supplements/current failed:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}


