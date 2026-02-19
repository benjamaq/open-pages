import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isProActive } from '@/lib/entitlements/pro'

export async function POST(request: NextRequest, ctx: any) {
  // Resolve Next 14+ params (can be a promise)
  let id: string | null = null
  try {
    const p = ctx?.params
    if (p && typeof p.then === 'function') {
      const resolved = await p
      id = String(resolved?.id || '')
    } else {
      id = String(p?.id || '')
    }
  } catch {}
  console.log('[testing API] HIT:', id, request.method, request.url)

  const supabase = await createClient()
  try {
    // Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    // Body
    const body = await request.json().catch(() => ({}))
    const status = String(body?.status || '').toLowerCase()
    if (!['inactive', 'testing'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Ownership
    const { data: row } = await supabase
      .from('user_supplement')
      .select('id,user_id,testing_status')
      .eq('id', id)
      .maybeSingle()
    if (!row || String((row as any).user_id) !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Enforce Starter limit when enabling testing
    if (status === 'testing') {
      // Determine tier
      let isPremium = false
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tier,pro_expires_at')
          .eq('user_id', user.id)
          .maybeSingle()
        isPremium = isProActive({ tier: (profile as any)?.tier, pro_expires_at: (profile as any)?.pro_expires_at })
      } catch {}

      if (!isPremium) {
        const { count } = await supabase
          .from('user_supplement')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('testing_status', ['complete','inconclusive'])
        const verdictCount = Number(count || 0)
        if (verdictCount >= 5) {
          return NextResponse.json({
            error: 'limit_reached',
            message: 'You have 5 verdicts on Starter plan. Upgrade to Premium to unlock them and continue testing.'
          }, { status: 403 })
        }
      }
    }

    // Update testing_status
    const { data: updated, error } = await (supabase as any)
      .from('user_supplement')
      .update({ testing_status: status } as any)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id,testing_status')
      .maybeSingle()
    if (error || !updated) {
      return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 500 })
    }

    // Invalidate dashboard cache so the UI moves the card immediately (no stale cached payload).
    try {
      const { error: cacheErr } = await (supabase as any)
        .from('dashboard_cache')
        .delete()
        .eq('user_id', user.id)
      if (cacheErr) {
        try { console.log('[testing API] dashboard_cache delete failed (user client):', cacheErr?.message || cacheErr) } catch {}
        try {
          const { error: adminErr } = await (supabaseAdmin as any)
            .from('dashboard_cache')
            .delete()
            .eq('user_id', user.id)
          if (adminErr) {
            try { console.log('[testing API] dashboard_cache delete failed (admin):', adminErr?.message || adminErr) } catch {}
            try {
              const { error: updErr } = await (supabaseAdmin as any)
                .from('dashboard_cache')
                .update({ invalidated_at: new Date().toISOString() } as any)
                .eq('user_id', user.id)
              if (updErr) {
                try { console.log('[testing API] dashboard_cache update invalidated_at failed (admin):', updErr?.message || updErr) } catch {}
              }
            } catch {}
          }
        } catch {}
      }
    } catch {}

    return NextResponse.json({ ok: true, id: (updated as any).id, testing_status: (updated as any).testing_status })
  } catch (e: any) {
    console.error('[testing API] ERROR:', e?.message || e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
