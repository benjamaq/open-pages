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
    const debug = (url as any).search?.params?.get
      ? ((url as any).search.params.get('debug') === '1')
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
      // Include testing_status so clients can correctly partition Active vs On-the-Bench.
      .select('id,user_id,is_active,testing_status,created_at,name,label,monthly_cost_usd,dose,timing,brand,inferred_start_at,retest_started_at')
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
        .select('id,name,monthly_cost,dose,timing,brand,notes,frequency,start_date,user_supplement_id')
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
      const siByUserSupplementId = new Map<string, any>()
      for (const item of stackItems) {
        const key = normalize(item?.name)
        if (key && !siByKey.has(key)) siByKey.set(key, item)
        const usid = String((item as any)?.user_supplement_id || '').trim()
        if (usid && !siByUserSupplementId.has(usid)) siByUserSupplementId.set(usid, item)
      }

      // Backfill orphaned user_supplement rows (created during older flows) that have no stack_items row.
      // This ensures My Stack can later persist dose/timing/brand into stack_items.
      try {
        const orphans = (rows || []).filter((r: any) => {
          const usid = String(r?.id || '').trim()
          if (!usid) return false
          return !siByUserSupplementId.has(usid)
        })
        if (orphans.length > 0) {
          if (debug) {
            // eslint-disable-next-line no-console
            console.log('[current] orphan user_supplement rows missing stack_items:', orphans.map((r: any) => ({ id: r.id, name: r.name || r.label })))
          }
          const toInsert: any[] = []
          for (const r of orphans) {
            const usid = String(r?.id || '').trim()
            const rawName = String(r?.name || r?.label || '').trim()
            if (!usid || !rawName) continue
            const key = normalize(rawName)
            const existing = key ? siByKey.get(key) : undefined
            const startDate = (r as any)?.inferred_start_at || (r as any)?.created_at || null

            // If we already have a stack_item for this name but it wasn't linked, link it instead of inserting a duplicate.
            if (existing && !String((existing as any)?.user_supplement_id || '').trim()) {
              try {
                const payload: any = {
                  user_supplement_id: usid,
                  // ensure defaults exist for display
                  frequency: (existing as any)?.frequency || 'daily',
                  start_date: (existing as any)?.start_date || startDate,
                }
                const { error: linkErr } = await supabaseAdmin
                  .from('stack_items')
                  .update(payload as any)
                  .eq('id', String((existing as any).id))
                  .eq('profile_id', profileId)
                if (!linkErr) {
                  ;(existing as any).user_supplement_id = usid
                  if (!siByUserSupplementId.has(usid)) siByUserSupplementId.set(usid, existing)
                }
              } catch {}
              continue
            }

            toInsert.push({
              profile_id: profileId,
              name: rawName,
              user_supplement_id: usid,
              frequency: 'daily',
              start_date: startDate,
              created_at: new Date().toISOString(),
            })
          }

          if (toInsert.length > 0) {
            const { data: inserted, error: insErr } = await (supabaseAdmin as any)
              .from('stack_items')
              .insert(toInsert as any)
              .select('id,name,monthly_cost,dose,timing,brand,notes,frequency,start_date,user_supplement_id')
            if (insErr) {
              if (debug) {
                // eslint-disable-next-line no-console
                console.warn('[current] stack_items orphan backfill insert failed:', insErr.message)
              }
            } else if (Array.isArray(inserted)) {
              for (const it of inserted) {
                stackItems.push(it)
                const k = normalize(it?.name)
                if (k && !siByKey.has(k)) siByKey.set(k, it)
                const id = String((it as any)?.user_supplement_id || '').trim()
                if (id && !siByUserSupplementId.has(id)) siByUserSupplementId.set(id, it)
              }
            }
          }
        }
      } catch {}

      rows = rows.map((r: any) => {
        const key = normalize(r?.name || r?.label)
        const match = siByUserSupplementId.get(String(r?.id || '').trim()) || (key ? siByKey.get(key) : undefined)
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


