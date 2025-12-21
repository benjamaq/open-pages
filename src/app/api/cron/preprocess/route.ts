import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const sb = supabaseAdmin
    // Iterate all users via profiles; fallback to distinct daily_entries users if profiles is empty
    const { data: profiles, error: pErr } = await sb.from('profiles').select('user_id')
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

    let processed = 0
    const users: string[] = (profiles || []).map(p => (p as any).user_id).filter(Boolean)
    // Fallback: collect users from daily_entries if no profiles found
    if (!users.length) {
      const { data: deUsers } = await sb.from('daily_entries').select('user_id').limit(1000)
      const set = new Set<string>()
      for (const r of deUsers || []) { if ((r as any).user_id) set.add((r as any).user_id) }
      users.push(...Array.from(set))
    }

    const since = new Date()
    since.setDate(since.getDate() - 90) // widen to 90 days for safety
    let entriesFound = 0
    for (const userId of users) {
      if (!userId) continue
      const { data: entries, error: eErr } = await sb
        .from('daily_entries')
        .select('local_date,mood,energy,focus,tags')
        .eq('user_id', userId)
        .gte('local_date', since.toISOString().slice(0,10))
      if (eErr) {
        // Log and continue with next user
        try { console.log('[preprocess] query error', { userId, message: eErr.message }) } catch {}
        continue
      }
      // Fallback retry without date filter if selection returned nothing (diagnostics)
      let retried = false
      let rows = entries || []
      if (!rows.length) {
        retried = true
        const { data: allRows } = await sb
          .from('daily_entries')
          .select('local_date,mood,energy,focus,tags')
          .eq('user_id', userId)
          .order('local_date', { ascending: true })
          .limit(400)
        rows = allRows || []
      }

      for (const e of rows) {
        entriesFound++
        const date = String((e as any).local_date).slice(0,10)
        const mood = typeof (e as any).mood === 'number' ? (e as any).mood : null
        const energy = typeof (e as any).energy === 'number' ? (e as any).energy : null
        const focus = typeof (e as any).focus === 'number' ? (e as any).focus : null
        const tags: string[] = Array.isArray((e as any).tags) ? (e as any).tags : []
        const sleep = typeof (e as any).sleep_quality === 'number' ? (e as any).sleep_quality : null
        const hrv = typeof (e as any).hrv === 'number' ? (e as any).hrv : null
        const recovery = typeof (e as any).recovery_score === 'number' ? (e as any).recovery_score : null
        const NOISE = new Set(['alcohol','travel','high_stress','illness','poor_sleep','intense_exercise','new_supplement'])
        const noiseScore = tags.reduce((acc, t) => acc + (NOISE.has(String(t).toLowerCase()) ? 1 : 0), 0)
        const isClean = noiseScore === 0
        // Composite scaled to 0-10 baseline
        const safe = (n: number | null) => (typeof n === 'number' && Number.isFinite(n) ? n : 0)
        const compositeRaw = (safe(mood) * 0.4) + (safe(energy) * 0.3) + (safe(focus) * 0.3) - (0.2 * noiseScore)
        const composite = Number.isFinite(compositeRaw) ? compositeRaw : null
        await sb.from('daily_processed_scores').upsert({
          user_id: userId,
          date,
          mood,
          energy,
          focus,
          composite_score: composite,
          noise_score: noiseScore,
          is_clean: isClean,
          sleep_score: null,
          hrv: null,
          recovery: null
        }, { onConflict: 'user_id,date' })
        processed++
      }
    }
    const debug = {
      usersFound: users,
      since: since.toISOString().slice(0,10),
      entriesFound
    }
    try { console.log('[preprocess] debug', debug) } catch {}
    return NextResponse.json({ ok: true, processed, debug })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


