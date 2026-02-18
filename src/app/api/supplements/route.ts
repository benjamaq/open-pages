import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateTruthReportForSupplement } from '@/lib/truthEngine'
import { persistTruthReportSingle } from '@/lib/truth/persistTruthReportSingle'

export async function GET() {
  const supabase = await createClient()
  try {
    // Debug logs for emergency tracing
    // eslint-disable-next-line no-console
    console.log('=== GET /api/supplements ===')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    // eslint-disable-next-line no-console
    console.log('User ID:', user?.id)
    if (authError || !user) {
      // eslint-disable-next-line no-console
      console.log('ERROR: No user or auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_supplement')
      .select('*')
      .eq('user_id', user.id)
      // Include rows where is_active is true OR null (null seen in some older rows)
      .or('is_active.eq.true,is_active.is.null')
      .order('created_at', { ascending: false })

    // eslint-disable-next-line no-console
    console.log('Found supplements:', (data || []).length)
    // eslint-disable-next-line no-console
    console.log('Supplements:', data)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Normalize rows:
    // - Ensure primary_goal_tags present (fallback to primary_metric when missing)
    // - Clamp monthly_cost_usd to [0, 500] to avoid unrealistic UI outliers
    let rows: any[] = data || []

    // Resolve profile id with admin fallback to avoid RLS/race blocking
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
      try {
        const { data: ap } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()
        profileId = (ap as any)?.id ?? null
      } catch {}
    }

    // Prefer stack_items (newer flow) when present; otherwise use user_supplement
    let stackItems: any[] | null = null
    if (profileId) {
      const { data: si } = await supabaseAdmin
        .from('stack_items')
        .select('id,name,created_at,monthly_cost,primary_goal_tags,tags,dose,timing,brand,notes,user_supplement_id')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
      // eslint-disable-next-line no-console
      console.log('stack_items count:', (si || []).length)
      stackItems = si || []
    }
    if (Array.isArray(stackItems) && stackItems.length > 0) {
      // Build fallback maps from user_supplement by normalized name
      const costByName = new Map<string, number>()
      const tagsByName = new Map<string, string[]>()
      const idByName = new Map<string, string>()
      const metaById = new Map<string, any>()
      const metaByName = new Map<string, any>()
      for (const r of rows) {
        const nm = String((r as any)?.name || '').trim().toLowerCase()
        const cost = Number((r as any)?.monthly_cost_usd)
        if (nm && Number.isFinite(cost) && cost > 0) {
          costByName.set(nm, Math.max(0, Math.min(80, cost)))
        }
        const tags = Array.isArray((r as any)?.primary_goal_tags) ? (r as any).primary_goal_tags : []
        if (nm && tags.length > 0) {
          tagsByName.set(nm, tags)
        }
        const uid = String((r as any)?.id || '')
        if (nm && uid) idByName.set(nm, uid)
        if (uid) metaById.set(uid, r)
        if (nm && !metaByName.has(nm)) metaByName.set(nm, r)
      }
      const converted = stackItems.map((r: any) => {
        const nm = String(r?.name || '').trim().toLowerCase()
        const mc = Number(r?.monthly_cost ?? 0)
        const monthly_cost_usd = Number.isFinite(mc) && mc > 0 ? Math.max(0, Math.min(80, mc)) : (costByName.get(nm) ?? 0)
        const mergedTags: string[] =
          Array.isArray(r.primary_goal_tags) && r.primary_goal_tags.length > 0
            ? r.primary_goal_tags
            : (tagsByName.get(nm) || (Array.isArray(r.tags) ? r.tags : []))
        // Intake linkage: prefer explicit FK if present; else fuzzy by normalized name
        const linkedUserSuppId = r.user_supplement_id || idByName.get(nm) || null
        const intake_id = linkedUserSuppId || r.id
        const meta = (linkedUserSuppId ? metaById.get(String(linkedUserSuppId)) : null) || metaByName.get(nm) || null
        const is_active = meta?.is_active === false ? false : true
        const testing_status = String(meta?.testing_status || 'testing').toLowerCase()
        // Prefer retest/inferred start dates from user_supplement when present
        const retest_started_at = meta?.retest_started_at ?? null
        const inferred_start_at = meta?.inferred_start_at ?? null
        const started_at = retest_started_at || inferred_start_at || r.created_at
        return {
          id: r.id,
          user_id: user.id,
          name: r.name,
          is_active,
          testing_status,
          // Expose both created_at and started_at for clients that expect either
          created_at: r.created_at,
          started_at,
          retest_started_at,
          inferred_start_at,
          // Map stack_items.monthly_cost → monthly_cost_usd for unified downstream consumption
          monthly_cost_usd,
          // Prefer explicit stack_items.primary_goal_tags, else user_supplement tags, else stack_items.tags, else empty
          primary_goal_tags: mergedTags,
          // Pass through descriptive fields used by Cabinet UI
          dose: r.dose ?? null,
          timing: r.timing ?? null,
          brand: r.brand ?? null,
          notes: r.notes ?? null,
          // NEW: explicit link for intake and engines
          user_supplement_id: r.user_supplement_id ?? null,
          intake_id,
        }
      })
      // Use stack_items as the single source of truth when present to avoid double-counting
      rows = converted
    }

    const normalized = rows.map((row: any) => {
      // Declared intent only — no name-based inference
      const primary_goal_tags = Array.isArray(row?.primary_goal_tags) ? row.primary_goal_tags : []

      const rawMonthly = Number(row?.monthly_cost_usd)
      const monthly_cost_usd = Number.isFinite(rawMonthly)
        ? Math.max(0, Math.min(80, rawMonthly))
        : 0

      return {
        ...row,
        primary_goal_tags,
        monthly_cost_usd,
        // Ensure intake_id always present for clients (CheckinModal)
        intake_id: row.intake_id || row.user_supplement_id || row.id,
      }
    })

    // eslint-disable-next-line no-console
    console.log('Normalized supplements (count):', normalized.length)
    return NextResponse.json(normalized)
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('GET /api/supplements failed:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json().catch(() => ({})) as any
    try { console.log('[supplements][POST] RECEIVED:', body) } catch {}
    const rawName = String(body?.name || '').trim()
    if (!rawName) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    // Dedupe guard: avoid creating duplicate user_supplement rows with identical names for the same user.
    // This is intentionally conservative (exact-name match only) to avoid blocking legitimately different products.
    try {
      const target = rawName.toLowerCase().replace(/\s+/g, ' ').trim()
      const { data: existing } = await supabase
        .from('user_supplement')
        .select('id,name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      const hit = (existing || []).find((r: any) => {
        const nm = String((r as any)?.name || '').toLowerCase().replace(/\s+/g, ' ').trim()
        return nm === target
      })
      if (hit && (hit as any)?.id) {
        return NextResponse.json({ id: String((hit as any).id), deduped: true })
      }
    } catch {}
    // Dose/timing/brand from client (new fields)
    const doseFromBody = typeof body?.dose === 'string' ? String(body.dose).trim() : undefined
    const timingFromBody = typeof body?.timing === 'string' ? String(body.timing).trim() : undefined
    // brand passed explicitly or parsed from name before the first comma
    const brandFromBody = typeof body?.brand === 'string' ? String(body.brand).trim() : undefined
    const parsedBrand = (() => {
      const idx = rawName.indexOf(',')
      if (idx > 0) return rawName.slice(0, idx).trim()
      return undefined
    })()
    const normalizedName = rawName.toLowerCase()
    // Optional monthly cost from client
    const rawMonthlyFromBody = Number(body?.monthly_cost_usd)
    const monthlyFromBody = Number.isFinite(rawMonthlyFromBody) ? Math.max(0, Math.min(80, rawMonthlyFromBody)) : undefined
    // Optional declared intent categories
    const bodyTags = Array.isArray(body?.primary_goal_tags) ? body.primary_goal_tags : undefined
    try { console.log('Saving primary_goal_tags:', bodyTags) } catch {}
    // Optional backdated start date for implicit ON/OFF (from add-supplement flow)
    const bodyStartDate = typeof body?.startDate === 'string' ? String(body.startDate).slice(0, 10) : undefined
    const bodyEndDate = typeof body?.endDate === 'string' ? String(body.endDate).slice(0, 10) : undefined
    // Defensive: ignore future dates
    const isFuture = (iso?: string) => {
      if (!iso) return false
      const d = new Date(iso); const t = new Date()
      d.setHours(0,0,0,0); t.setHours(0,0,0,0)
      return d.getTime() > t.getTime()
    }
    // Accept alternate keys just in case
    const altStart = typeof body?.start_date === 'string' ? String(body.start_date).slice(0, 10) : undefined
    const inferredStartISO = (bodyStartDate || altStart) && !isFuture(bodyStartDate || altStart) ? (bodyStartDate || altStart) : undefined
    try { console.log('[supplements] startDate received:', bodyStartDate || altStart, '-> inferredStartISO:', inferredStartISO) } catch {}

    // 1) Try to map via canonical_supplement (if table exists)
    let canonicalName: string | null = null
    try {
      const { data: canRow } = await supabase
        .from('canonical_supplement')
        .select('generic_name')
        .ilike('generic_name', normalizedName)
        .maybeSingle()
      if ((canRow as any)?.generic_name) {
        canonicalName = String((canRow as any).generic_name).toLowerCase()
      }
    } catch {
      // Table might not exist in some deployments; ignore
    }
    if (!canonicalName) {
      // Alternative legacy table name
      try {
        const { data: canLegacy } = await supabase
          .from('canonical_supplements')
          .select('generic_name')
          .ilike('generic_name', normalizedName)
          .maybeSingle()
        if ((canLegacy as any)?.generic_name) {
          canonicalName = String((canLegacy as any).generic_name).toLowerCase()
        }
      } catch {}
    }

    // 2) Ensure a supplement row exists; prefer matching canonical name, else by supplement canonical_name or synonyms
    let supplementRow: { id: string } | null = null
    const desiredCanonical = canonicalName || normalizedName

    // Try exact/ilike match on supplement.canonical_name
    {
      const { data: s1 } = await supabase
        .from('supplement')
        .select('id, canonical_name')
        .ilike('canonical_name', desiredCanonical)
        .maybeSingle()
      if ((s1 as any)?.id) supplementRow = { id: (s1 as any).id }
    }
    // Try match in synonyms array
    if (!supplementRow) {
      try {
        const { data: s2 } = await supabase
          .from('supplement')
          .select('id, synonyms')
          .contains('synonyms', [normalizedName])
          .maybeSingle()
        if ((s2 as any)?.id) supplementRow = { id: (s2 as any).id }
      } catch {}
    }
    // Create supplement if still missing
    if (!supplementRow) {
      const { data: createdSupp, error: suppErr } = await supabase
        .from('supplement')
        .insert({
          canonical_name: desiredCanonical,
          synonyms: [rawName, normalizedName]
        } as any)
        .select('id')
        .single()
      if (suppErr || !(createdSupp as any)?.id) {
        return NextResponse.json({ error: suppErr?.message || 'Failed to ensure supplement' }, { status: 500 })
      }
      supplementRow = { id: (createdSupp as any).id }
    }

    // 3) Insert user_supplement referencing the REAL supplement.id (FK-safe)
    const nowIso = new Date().toISOString()
    const insertPayload: Record<string, any> = {
      user_id: user.id,
      supplement_id: supplementRow.id,
      is_active: true,
      created_at: nowIso
    }
    // Many schemas include a free-text name/label; set if column exists (harmless if ignored)
    insertPayload.name = rawName
    insertPayload.label = rawName
    // Persist dose/timing/brand if provided
    if (doseFromBody) insertPayload.dose = doseFromBody
    if (timingFromBody) insertPayload.timing = timingFromBody
    if (brandFromBody || parsedBrand) insertPayload.brand = (brandFromBody || parsedBrand)
    if (monthlyFromBody != null) {
      insertPayload.monthly_cost_usd = monthlyFromBody
    }
    if (bodyTags) {
      insertPayload.primary_goal_tags = bodyTags
    }
    // Persist inferred_start_at when provided by client (backdated start)
    if (inferredStartISO) {
      insertPayload.inferred_start_at = inferredStartISO
    }
    try { console.log('Insert payload:', insertPayload) } catch {}

    // Determine tier (Starter vs Premium) and current testing count
    let isPremium = false
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('tier')
        .eq('user_id', user.id)
        .maybeSingle()
      const tierLc = String((prof as any)?.tier || '').toLowerCase()
      isPremium = ['pro','premium','creator'].includes(tierLc)
    } catch {}
    let verdictCount = 0
    try {
      const { count } = await supabase
        .from('user_supplement')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('testing_status', ['complete','inconclusive'])
      verdictCount = Number(count || 0)
    } catch {}
    const STARTER_TESTING_LIMIT = 5
    const desiredTestingStatus = (!isPremium && verdictCount >= STARTER_TESTING_LIMIT) ? 'inactive' : 'testing'

    const { data: userSupp, error: usErr } = await (supabase as any)
      .from('user_supplement')
      .insert({ ...insertPayload, testing_status: desiredTestingStatus } as any)
      .select('id')
      .maybeSingle()

    if (!usErr && userSupp?.id) {
      // Also ensure a stack_items row is created for UI/display
      try {
        // Resolve profile_id for the current user
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
          try {
            const { data: ap } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle()
            profileId = (ap as any)?.id ?? null
          } catch {}
        }
        if (profileId) {
          const stackPayload: any = {
            profile_id: profileId,
            name: rawName,
            user_supplement_id: String(userSupp.id),
          }
          // Persist dose/timing/brand/frequency/time_of_day into stack_items (these are the fields My Stack displays)
          try {
            const dose = typeof body?.dose === 'string' ? String(body.dose).trim() : ''
            const timing = typeof body?.timing === 'string' ? String(body.timing).trim() : ''
            const brand = typeof body?.brand === 'string' ? String(body.brand).trim() : ''
            const frequency = typeof body?.frequency === 'string' ? String(body.frequency).trim() : ''
            const timeOfDay = typeof body?.time_of_day === 'string' ? String(body.time_of_day).trim() : ''
            if (dose) stackPayload.dose = dose
            if (timing) stackPayload.timing = timing
            if (brand) stackPayload.brand = brand
            if (frequency) stackPayload.frequency = frequency
            if (timeOfDay) stackPayload.time_of_day = timeOfDay
          } catch {}
          if (typeof monthlyFromBody === 'number') stackPayload.monthly_cost = monthlyFromBody
          if (inferredStartISO) stackPayload.start_date = inferredStartISO
          await supabase.from('stack_items').insert(stackPayload)
        }
      } catch {}
      // Invalidate cached dashboard payload so newly added supplements appear immediately.
      try {
        const ts = new Date().toISOString()
        await (supabaseAdmin as any)
          .from('dashboard_cache')
          .upsert({ user_id: user.id, invalidated_at: ts } as any, { onConflict: 'user_id' } as any)
      } catch {}
      // Hardening: if inferred_start_at did not persist on insert, set it explicitly now
      if (inferredStartISO) {
        try {
          const { error: fixErr } = await (supabase as any)
            .from('user_supplement')
            .update({ inferred_start_at: inferredStartISO } as any)
            .eq('id', String(userSupp.id))
            .eq('user_id', user.id)
          if (fixErr) { try { console.warn('[supplements] post-insert inferred_start_at update failed:', fixErr.message) } catch {} }
        } catch {}
        // If the user has wearable data, trigger truth-engine immediately for instant verdicts
        try {
          const { count: wearableCount } = await supabase
            .from('daily_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .not('wearables', 'is', null)
          if ((wearableCount || 0) > 0) {
            try { console.log('[supplements] Triggering Truth Engine for', String(userSupp.id), 'wearableCount=', wearableCount, 'start=', inferredStartISO) } catch {}
            const fresh = await generateTruthReportForSupplement(user.id, String(userSupp.id))
            // Persist the report immediately so dashboard reads it on next load
            try {
              const payloadToStore = {
                user_id: user.id,
                user_supplement_id: String(userSupp.id),
                canonical_id: null as string | null,
                status: fresh.status,
                primary_metric: fresh.primaryMetricLabel,
                effect_direction: fresh.effect.direction,
                effect_size: fresh.effect.effectSize,
                absolute_change: fresh.effect.absoluteChange,
                percent_change: fresh.effect.percentChange,
                confidence_score: fresh.confidence.score,
                sample_days_on: fresh.meta.sampleOn,
                sample_days_off: fresh.meta.sampleOff,
                days_excluded_confounds: fresh.meta.daysExcluded,
                onset_days: fresh.meta.onsetDays,
                responder_percentile: fresh.community.userPercentile,
                responder_label: fresh.community.responderLabel,
                confounds: [],
                mechanism_inference: fresh.mechanism.label,
                biology_profile: fresh.biologyProfile,
                next_steps: fresh.nextSteps,
                science_note: fresh.scienceNote,
                raw_context: fresh
              }
              await persistTruthReportSingle(payloadToStore)
            } catch (saveErr: any) {
              try { console.warn('[supplements] truth save failed:', saveErr?.message || saveErr) } catch {}
            }
          } else {
            try { console.log('[supplements] Skipping Truth Engine trigger — no wearable data') } catch {}
          }
        } catch (teErr: any) {
          try { console.warn('[supplements] Truth Engine trigger failed:', teErr?.message || teErr) } catch {}
        }
      }
      return NextResponse.json({ id: userSupp.id, testing_status: desiredTestingStatus, limitReached: desiredTestingStatus === 'inactive' })
    }
    // If duplicate (unique user_id,supplement_id), fetch existing row and return its id
    const { data: existing } = await supabase
      .from('user_supplement')
      .select('id')
      .eq('user_id', user.id)
      .eq('supplement_id', supplementRow.id)
      .maybeSingle()
    if ((existing as any)?.id) {
      return NextResponse.json({ id: (existing as any).id, testing_status: desiredTestingStatus, limitReached: desiredTestingStatus === 'inactive' })
    }

    // 4) Fallback path removed: we must always create a FK-valid user_supplement
    return NextResponse.json({ error: usErr?.message || 'Insert failed' }, { status: 500 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

