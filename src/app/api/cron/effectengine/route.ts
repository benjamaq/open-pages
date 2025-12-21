import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { computeSignal } from '@/lib/analysis/signal'
import { cohenD, bootstrapConfidence, prePostEffect, trendBreak } from '@/lib/analysis/effect'
import { classifyEffect } from '@/lib/analysis/classify'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const sb = supabaseAdmin
    const { data: profiles, error: pErr } = await sb.from('profiles').select('id,user_id')
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

    let analyzed = 0
    const debugUsers: Array<{ userId: string, supps: number, daily: number, analyzed: number }> = []
    const insertLogs: Array<{ userId: string, user_supplement_id: string, error?: string, id?: string }> = []
    for (const prof of profiles || []) {
      const userId = (prof as any).user_id
      if (!userId) continue
      // Active supplements from user_supplement
      const { data: supps } = await sb
        .from('user_supplement')
        .select('id,name,inferred_start_at,created_at,is_active')
        .eq('user_id', userId)
        .eq('is_active', true)

      // Load processed daily scores
      const { data: daily } = await sb
        .from('daily_processed_scores')
        .select('date,composite_score,is_clean')
        .eq('user_id', userId)

      // Load per-day supplement intake
      const since = new Date()
      since.setDate(since.getDate() - 365)
      const { data: de } = await sb
        .from('daily_entries')
        .select('local_date,supplement_intake')
        .eq('user_id', userId)
        .gte('local_date', since.toISOString().slice(0,10))

      let userAnalyzed = 0
      const byDate = new Map<string, { composite: number | null; clean: boolean }>()
      for (const d of daily || []) {
        byDate.set(String((d as any).date), {
          composite: (d as any).composite_score,
          clean: !!(d as any).is_clean
        })
      }
      const intakeByDate = new Map<string, Record<string, string>>()
      for (const r of de || []) {
        const key = String((r as any).local_date).slice(0,10)
        const obj = (r as any).supplement_intake || {}
        intakeByDate.set(key, obj)
      }

      for (const s of supps || []) {
        const start = (s as any).inferred_start_at ? String((s as any).inferred_start_at).slice(0,10) : String((s as any).created_at).slice(0,10)
        // Count clean ON/OFF days since start using supplement_intake (default ON if absent)
        let cleanDays = 0
        let daysOn = 0
        let daysOff = 0
        const onVals: number[] = []
        const offVals: number[] = []
        for (const [d, v] of byDate.entries()) {
          if (!v.clean) continue
          if (d < start) continue
          cleanDays++
          const intake = intakeByDate.get(d) || {}
          const status = (intake as any)[(s as any).id] as string | undefined
          const isOff = status === 'skipped'
          const isOn = status === 'taken' || status == null
          if (isOff) {
            daysOff++
            if (typeof v.composite === 'number') offVals.push(v.composite)
          } else if (isOn) {
            daysOn++
            if (typeof v.composite === 'number') onVals.push(v.composite)
          }
        }
        const signal = computeSignal(cleanDays, 12)
        if (signal < 100) continue

        // A) ON/OFF Cohen's d + bootstrap
        const d = cohenD(onVals, offVals)
        const conf = bootstrapConfidence(onVals, offVals, 400)
        const dir: 'positive' | 'negative' | 'neutral' = d > 0 ? 'positive' : d < 0 ? 'negative' : 'neutral'

        // B) Pre/Post mean delta
        const pre = offVals.slice(-14)
        const post = onVals.slice(0, 14)
        const prePost = prePostEffect(pre, post)

        // C) Trend break
        const trend = trendBreak(offVals.slice(-30), onVals.slice(0, 30))

        // Classification
        const category = classifyEffect({ direction: dir, magnitude: Math.abs(d), confidence: conf }, null, { delta: trend.delta })

        // Store
        try {
          const { data: effRow, error: effErr } = await sb
            .from('user_supplement_effect')
            .upsert({
              user_id: userId,
              user_supplement_id: (s as any).id,
              effect_direction: dir,
              effect_magnitude: Math.abs(d),
              effect_confidence: conf,
              effect_category: category,
              days_on: daysOn,
              days_off: daysOff,
              clean_days: cleanDays,
              noisy_days: null,
              pre_start_average: pre.length ? pre.reduce((a, b) => a + b, 0) / pre.length : null,
              post_start_average: post.length ? post.reduce((a, b) => a + b, 0) / post.length : null,
              analysis_mode: 'auto',
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,user_supplement_id' })
            .select('id')
            .maybeSingle()
          if (effErr) {
            insertLogs.push({ userId, user_supplement_id: (s as any).id, error: effErr.message })
          } else {
            insertLogs.push({ userId, user_supplement_id: (s as any).id, id: (effRow as any)?.id })
          }
        } catch (e: any) {
          insertLogs.push({ userId, user_supplement_id: (s as any).id, error: e?.message || String(e) })
        }

        analyzed++; userAnalyzed++
      }
      debugUsers.push({ userId, supps: (supps || []).length, daily: (daily || []).length, analyzed: userAnalyzed })
    }
    try { console.log('[effectengine] debug', debugUsers) } catch {}
    return NextResponse.json({ ok: true, analyzed, debug: { users: debugUsers, inserts: insertLogs } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


