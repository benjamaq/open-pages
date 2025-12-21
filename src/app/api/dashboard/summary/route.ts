import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabase as supabaseAdmin } from '@/lib/supabase/admin'
import { computeSignal } from '@/lib/engine/index'
import { upsertPatternInsight } from '@/lib/engine/persist'

export async function GET() {
  // Force stdout
  process.stdout.write('\n' + '='.repeat(80) + '\n')
  process.stdout.write('🔥🔥🔥 SUMMARY ENDPOINT HIT 🔥🔥🔥\n')
  process.stdout.write('='.repeat(80) + '\n')
  console.error('🚨 ERROR LOG TEST - YOU SHOULD SEE THIS')
  console.log('📊 Regular log test')
  try {
    console.log('🚀 SUMMARY ENDPOINT CALLED')
    console.log('================================================================================')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    console.error('👤 USER:', user?.id)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    let { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!profile) {
      // Attempt to bootstrap a minimal profile via service role (handles RLS)
      try {
        const now = new Date().toISOString()
        const baseName = (user.user_metadata?.first_name as string) || (user.email?.split('@')[0] as string) || 'user'
        const slugBase = (baseName || 'user').toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const slug = `${slugBase}-${Date.now().toString(36)}`
        const { data: created, error: createErr } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: user.id,
            first_name: baseName,
            display_name: baseName,
            slug,
            public: true,
            allow_stack_follow: true,
            created_at: now,
            updated_at: now
          })
          .select('id')
          .single()
        if (createErr) {
          console.warn('Profile bootstrap (summary) failed:', createErr.message)
        } else {
          profile = created as any
        }
      } catch (e) {
        console.warn('Profile bootstrap exception:', e)
      }
      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
    }
    
  // Prefer stack_items for projects that use it; fall back to user_supplement when none found
    let items: any[] = []
    try {
      const { data: itemsRaw } = await supabase
        .from('stack_items')
        .select('id,name,dose')
        .eq('profile_id', (profile as any).id)
        .eq('item_type', 'supplements')
        .order('created_at', { ascending: false })
      items = (itemsRaw as any[]) || []
    } catch (e) {
      console.warn('stack_items query failed or not present:', e)
    }
    if (!items || items.length === 0) {
      try {
        const { data: us } = await supabase
          .from('user_supplement')
          .select('id,name,monthly_cost_usd,created_at,is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
        items = (us || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          dose: null
        }))
      } catch (e) {
        console.warn('user_supplement fallback query failed:', e)
      }
    }
    console.error('📊 About to compute', (items || []).length, 'supplement signals')
    
    // Fetch pattern insights as fallback/enrichment
    console.log('🔎 Fetching insights for profile_id:', (profile as any).id)
    const { data: insightsRaw, error: insightsError } = await supabase
      .from('pattern_insights')
      .select('id,profile_id,intervention_id,metric,effect_size,confidence_score,sample_size,status,created_at')
      .eq('profile_id', (profile as any).id)
      .order('created_at', { ascending: false })
    if (insightsError) {
      console.error('❌ Insights query error:', insightsError)
    } else {
      console.log('✅ Found insights:', (insightsRaw || []).length)
    }
    const insightsByIntervention = new Map<string, any[]>()
    for (const ins of insightsRaw || []) {
      const key = String((ins as any).intervention_id)
      const list = insightsByIntervention.get(key) || []
      list.push(ins)
      insightsByIntervention.set(key, list)
    }
    // Join names from stack_items for display
    const interventionIds = Array.from(new Set((insightsRaw || []).map((x: any) => String(x.intervention_id))))
    let insightsJoined: Array<{ name: string; effect_size: number; confidence_score: number; status: string; direction: 'positive'|'negative'|'neutral' }> = []
    if (interventionIds.length > 0) {
      const { data: namesRaw, error: namesErr } = await supabase
        .from('stack_items')
        .select('id,name')
        .in('id', interventionIds)
      if (namesErr) {
        console.error('❌ stack_items name join error:', namesErr)
      } else {
        const idToName = new Map<string, string>()
        for (const r of (namesRaw || [])) idToName.set(String((r as any).id), String((r as any).name || 'Supplement'))
        insightsJoined = (insightsRaw || []).map((pi: any) => {
          const effect = Number(pi.effect_size) || 0
          const conf = Number(pi.confidence_score) || 0
          const direction: 'positive'|'negative'|'neutral' = effect > 0 ? 'positive' : effect < 0 ? 'negative' : 'neutral'
          return {
            name: idToName.get(String(pi.intervention_id)) || 'Supplement',
            effect_size: effect,
            confidence_score: conf,
            status: String(pi.status || 'inconclusive'),
            direction
          }
        })
      }
    }
    
    function calculateStatus(confidence: number, effectPct: number, n: number) {
      // WORKING (green)
      if (confidence >= 80 && effectPct >= 4 && n >= 14) {
        return {
          status: 'working',
          badge: 'Proven to Work',
          borderColor: 'border-green-500',
          barColor: 'bg-green-500',
          bgColor: 'bg-green-50'
        }
      }
      // NOT HELPING (red)
      if (confidence >= 70 && effectPct <= 0 && n >= 14) {
        return {
          status: 'not_helping',
          badge: 'Not Helping',
          borderColor: 'border-red-500',
          barColor: 'bg-red-500',
          bgColor: 'bg-red-50'
        }
      }
      // PROMISING (blue)
      if (confidence >= 60 && confidence < 80 && effectPct >= 4 && n >= 7) {
        return {
          status: 'likely_working',
          badge: 'Signal Emerging',
          borderColor: 'border-blue-500',
          barColor: 'bg-blue-500',
          bgColor: 'bg-blue-50'
        }
      }
      // TESTING (yellow)
      return {
        status: 'testing',
        badge: 'Testing',
        borderColor: 'border-yellow-500',
        barColor: 'bg-yellow-500',
        bgColor: 'bg-yellow-50'
      }
    }

    const supplements = await Promise.all(
      (items || []).map(async (it: any) => {
        console.error('🔬 Starting signal for:', it.name)
        console.log('🆔 Passing to engine - userId:', user.id, 'supplementId:', it.id)
        const { data: periodsRaw } = await supabase
          .from('intervention_periods')
          .select('start_date,end_date')
          .eq('intervention_id', it.id)
          .order('start_date', { ascending: true })
        const periods = (periodsRaw as any[]) || []
        // Real analysis snapshot
        let metric = 'sleep_quality'
        let signal = await computeSignal(user.id, it.id, '30d', 'sleep_quality')
        console.error('✅ Signal done:', it.name, '→', signal.status, '| n=', signal.n, 'conf=', signal.confidence)
        
        // If engine produced weak/empty values, try to enrich with pattern_insights
        if ((signal.n || 0) === 0 || (signal.confidence || 0) === 0) {
          const all = insightsByIntervention.get(String(it.id)) || []
          // prefer sleep_quality, else first
          let ins = all.find(x => (x as any).metric === 'sleep_quality') || all[0]
          if (ins) {
            console.log('🧪 Using pattern_insights fallback for', it.name, '→ sample=', (ins as any).sample_size, 'conf=', (ins as any).confidence_score, 'metric=', (ins as any).metric)
            metric = String((ins as any).metric || 'sleep_quality')
            // Prefer percentage from means; fallback to a rough conversion from Cohen's d
            const pre = Number((ins as any).pre_mean)
            const post = Number((ins as any).post_mean)
            const hasMeans = Number.isFinite(pre) && Number.isFinite(post) && pre !== 0
            const effectPct = hasMeans
              ? Math.round(((post - pre) / pre) * 100)
              : Math.round((Number((ins as any).effect_size) || 0) * 20) // small≈5%, medium≈12%, large≈20%
            const confidence = Math.round((Number((ins as any).confidence_score) || 0) * 100)
            const n = Number((ins as any).sample_size) || 0
            signal = {
              n,
              effectPct,
              confidence,
              status: 'testing',
              window: '30d',
              warnings: []
            } as any
          } else {
            console.log('ℹ️ No insights for', it.name)
          }
        }
        const statusObj = calculateStatus(Number(signal.confidence || 0), Number(signal.effectPct || 0), Number(signal.n || 0))
        const enriched = {
          id: it.id,
          name: it.name,
          dose: it.dose || undefined,
          periods: (periods || []).map(p => ({ startDate: p.start_date as string, endDate: p.end_date as string | null })),
          effectPct: signal.effectPct,
          confidence: signal.confidence,
          n: signal.n,
          metric,
          status: statusObj.status,
          ui: statusObj,
          signal
        }
        // Persist insight when meaningful
        if ((signal.confidence || 0) > 0 && (signal.n || 0) > 0) {
          await upsertPatternInsight({
            profileId: (profile as any).id,
            interventionId: it.id,
            metric,
            effectPct: signal.effectPct ?? 0,
            confidence: signal.confidence ?? 0,
            n: signal.n ?? 0,
            status: signal.status as any,
            preMean: (signal as any).preMean ?? null,
            postMean: (signal as any).postMean ?? null
          })
        }
        return enriched
      })
    )
    
    // Fetch active experiments (simple view)
    const { data: expsRaw } = await supabase
      .from('experiments')
      .select('*')
      .eq('profile_id', (profile as any).id)
      .order('created_at', { ascending: false })
    const exps = (expsRaw as any[]) || []

    const experiments = (exps || []).map((e) => {
      const start = e.start_date ? new Date(e.start_date as any) : new Date()
      const today = new Date()
      const day = Math.max(1, Math.ceil((today.getTime() - start.getTime()) / 86400000))
      return {
        id: e.id,
        supplement_id: (e as any).intervention_id,
        supplement_name: (items || []).find(it => it.id === (e as any).intervention_id)?.name || 'Supplement',
        type: (e as any).experiment_type || 'on_off',
        duration: 7,
        current_day: day,
        status: e.status || (e.end_date ? 'completed' : 'active')
      }
    })

    const summary = {
      user: {
        monthlySavings: 0,
        truthProgress: null,
        hasCheckedToday: false
      },
      quickStats: null as any,
      supplements,
      activeExperiment: null as any,
      experiments,
      // New: direct pattern_insights join for dashboard consumption
      patternInsights: insightsJoined
    }
    return NextResponse.json(summary)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}


