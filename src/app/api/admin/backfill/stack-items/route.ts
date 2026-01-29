import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || ''
    const ok = auth === `Bearer ${process.env.CRON_SECRET}`
    if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await createClient()
    const limitParam = (() => {
      try { return Number(new URL(req.url).searchParams.get('limit') || '') } catch { return NaN }
    })()
    const LIMIT = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(500, Math.floor(limitParam)) : 1000

    // 1) Find user_supplement rows missing a corresponding stack_items.user_supplement_id
    const { data: missing } = await supabaseAdmin
      .from('user_supplement')
      .select('id,user_id,name,created_at,monthly_cost_usd')
      .limit(LIMIT)
    if (!missing || missing.length === 0) {
      return NextResponse.json({ ok: true, inserted: 0, scanned: 0, message: 'No supplements found' })
    }
    // Build fast set of existing stack links
    const { data: existingLinks } = await supabaseAdmin
      .from('stack_items')
      .select('user_supplement_id')
    const linked = new Set<string>((existingLinks || []).map((r: any) => String(r.user_supplement_id || '')))

    // 2) Resolve profile ids by user_id
    const userIds = Array.from(new Set(missing.map((m: any) => String(m.user_id || '')))).filter(Boolean)
    const { data: profs } = await supabaseAdmin
      .from('profiles')
      .select('id,user_id')
      .in('user_id', userIds)
    const userIdToProfileId = new Map<string, string>()
    for (const p of (profs || [])) userIdToProfileId.set(String((p as any).user_id), String((p as any).id))

    // 3) Prepare inserts for user_supplement rows that lack stack_items
    const toInsert: Array<{ profile_id: string; name: string; monthly_cost?: number | null; created_at?: string | null; user_supplement_id: string }> = []
    for (const us of missing) {
      const usid = String((us as any).id || '')
      if (!usid || linked.has(usid)) continue
      const pid = userIdToProfileId.get(String((us as any).user_id || ''))
      if (!pid) continue
      toInsert.push({
        profile_id: pid,
        name: String((us as any).name || 'Supplement'),
        monthly_cost: (typeof (us as any).monthly_cost_usd === 'number' ? (us as any).monthly_cost_usd : null),
        created_at: (us as any).created_at || null,
        user_supplement_id: usid
      })
    }
    let inserted = 0
    if (toInsert.length > 0) {
      const chunks: typeof toInsert[] = []
      for (let i = 0; i < toInsert.length; i += 500) chunks.push(toInsert.slice(i, i + 500))
      for (const chunk of chunks) {
        const { error } = await supabaseAdmin.from('stack_items').insert(chunk as any)
        if (!error) inserted += chunk.length
      }
    }
    return NextResponse.json({ ok: true, inserted, scanned: missing.length })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed' }, { status: 500 })
  }
}


