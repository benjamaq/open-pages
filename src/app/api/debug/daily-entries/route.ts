import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const url = new URL(req.url)
    const name = (url.searchParams.get('name') || '').trim().toLowerCase()
    const supplementIdParam = (url.searchParams.get('supplementId') || '').trim()
    const limit = Math.min(90, Math.max(1, Number(url.searchParams.get('limit') || 30)))

    let userSupplementId = supplementIdParam
    if (!userSupplementId && name) {
      const { data: rows } = await supabase
        .from('user_supplement')
        .select('id,name')
        .eq('user_id', user.id)
      const target = (rows || []).find(r => String((r as any).name || '').trim().toLowerCase() === name)
      userSupplementId = target ? String((target as any).id) : ''
    }
    if (!userSupplementId) {
      return NextResponse.json({ error: 'Provide ?supplementId=<user_supplement.id> or ?name=<supplement name>' }, { status: 400 })
    }

    const { data: entries, error } = await supabase
      .from('daily_entries')
      .select('local_date,tags,supplement_intake,skipped_supplements')
      .eq('user_id', user.id)
      .order('local_date', { ascending: false })
      .limit(limit)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const rows = (entries || []).map((e: any) => {
      const v = e?.supplement_intake ? (e.supplement_intake as any)[userSupplementId] : undefined
      const skippedArr = Array.isArray(e?.skipped_supplements) ? e.skipped_supplements : []
      const inSkipped = skippedArr.some((id: any) => String(id).replace(/"/g, '') === userSupplementId)
      let status: 'taken' | 'off' | 'unknown' = 'unknown'
      if (v === 'taken' || v === true || v === 1 || String(v).toLowerCase() === 'true') status = 'taken'
      else if (v === 'off' || v === 'skipped' || v === 'not_taken' || v === false || v === 0 || String(v).toLowerCase() === 'false') status = 'off'
      else if (inSkipped) status = 'off'
      const isClean = !(Array.isArray(e?.tags) && e.tags.length > 0)
      return {
        local_date: e.local_date,
        tags: e.tags || [],
        intake_value: v ?? null,
        in_skipped_array: inSkipped,
        status,
        clean_day: isClean
      }
    })

    return NextResponse.json({
      userSupplementId,
      count: rows.length,
      entries: rows
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}


