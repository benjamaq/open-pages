import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function hasAnyWearableMetric(w: any): boolean {
  if (!w || typeof w !== 'object') return false
  // Common keys across Apple Health, WHOOP, Oura, etc.
  const knownKeys = [
    'hrv_sdnn_ms', 'hrv_ms', 'hrv', 'hrv_rmssd',
    'resting_hr_bpm', 'resting_hr', 'rhr',
    'sleep_min', 'sleep_hours', 'deep_sleep_min', 'rem_sleep_min',
    'active_energy_kcal', 'recovery_score', 'readiness', 'strain',
    'sleep_performance_pct', 'steps'
  ]
  for (const k of knownKeys) {
    if (w[k] != null) return true
  }
  // Fallback: any numeric field at top-level
  for (const [k, v] of Object.entries(w)) {
    if (v != null && (typeof v === 'number')) return true
  }
  return false
}

export async function GET(request: Request) {
  try {
    // DIAGNOSTIC: log endpoint hit and since param
    const url = new URL(request.url)
    const sinceParam = url.searchParams.get('since')
    try {
      console.log('[wearable-status] === ENDPOINT HIT ===')
      console.log('[wearable-status] since param:', sinceParam || '(none)')
    } catch {}

    const supabase = await createClient()

    // DEBUG: Log all cookies to see what's available
    const { cookies: cookiesMod } = await import('next/headers')
    const cookieStore = await cookiesMod()
    const allCookies = cookieStore.getAll()
    try {
      console.log('[wearable-status] Available cookies:', allCookies.map((c: any) => c?.name))
    } catch {}
    // Check for Supabase auth cookie specifically (name contains 'auth-token')
    const authCookie = allCookies.find((c: any) => String(c?.name || '').includes('auth-token'))
    try {
      console.log('[wearable-status] Auth cookie exists:', !!authCookie)
    } catch {}

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    try {
      console.log('[wearable-status] Auth result:', {
        userId: (user as any)?.id || null,
        error: authError?.message || 'none'
      })
    } catch {}
    if (!user) {
      return NextResponse.json({
        wearable_connected: false,
        debug_reason: 'no_authenticated_user',
        debug_cookies: allCookies.map((c: any) => c?.name),
        debug_has_auth_cookie: !!authCookie
      })
    }

    // Determine window: default last 2 years (to avoid scanning 5+ years of imports)
    let rows: any[] | null = null
    let qErr: any = null
    if (sinceParam === 'all') {
      try { console.log('[wearable-status] ENTER since=all branch (exact head count) for user', (user as any)?.id) } catch {}
      try { console.log('[wearable-status] Querying for user_id:', (user as any)?.id) } catch {}
      // Use exact head count without row limit via authenticated client (RLS permits self-read)
      const { count: exactCount = 0, error: countErr } = await supabase
        .from('daily_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('wearables', 'is', null)
      try {
        console.log('[wearable-status] Count query result:', {
          count: exactCount,
          error: countErr,
          errorMessage: (countErr as any)?.message,
          errorCode: (countErr as any)?.code,
          errorDetails: (countErr as any)?.details
        })
        console.log('[wearable-status] Full count result:', JSON.stringify({ count: exactCount, error: countErr }, null, 2))
      } catch {}
      if (countErr) {
        try { console.error('[wearable-status] count error (since=all):', (countErr as any)?.message || countErr) } catch {}
        return NextResponse.json({
          wearable_connected: false,
          debug_reason: 'query_error_count',
          debug_error: (countErr as any)?.message || 'unknown',
          debug_code: (countErr as any)?.code || null,
          debug_details: JSON.stringify(countErr || null)
        })
      }
      // Min/max dates via targeted 1-row queries (authenticated client)
      const { data: minRow } = await supabase
        .from('daily_entries')
        .select('local_date')
        .eq('user_id', user.id)
        .not('wearables', 'is', null)
        .order('local_date', { ascending: true })
        .limit(1)
        .maybeSingle()
      const { data: maxRow } = await supabase
        .from('daily_entries')
        .select('local_date')
        .eq('user_id', user.id)
        .not('wearables', 'is', null)
        .order('local_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      // Get all distinct sources from user's wearable data (avoid sampling so we don't miss older sources)
      const { data: sourceRows } = await supabase
        .from('daily_entries')
        .select('wearables->source')
        .eq('user_id', user.id)
        .not('wearables', 'is', null)
        .not('wearables->source', 'is', null)
        .limit(5000)
      const sourcesSet = new Set<string>()
      for (const row of (sourceRows || [])) {
        const src = (row as any)['source'] || (row as any)?.wearables?.source
        if (typeof src === 'string' && src) sourcesSet.add(src)
      }
      // 4. Count check-in days (energy/mood/focus present)
      const { count: checkinCount, error: checkinErr } = await supabase
        .from('daily_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .or('energy.not.is.null,mood.not.is.null,focus.not.is.null')
      try {
        console.log('[wearable-status] Check-in count:', checkinCount, (checkinErr as any)?.message || 'none')
      } catch {}

      // 5. days_by_source counts using JSON contains by detected sources
      const daysBySource: Record<string, number> = {}
      for (const src of Array.from(sourcesSet)) {
        const { count: srcCount, error: srcErr } = await supabase
          .from('daily_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .contains('wearables', { source: src } as any)
        daysBySource[src] = srcCount || 0
        try {
          console.log('[wearable-status] days_by_source:', src, srcCount, (srcErr as any)?.message || 'none')
        } catch {}
      }

      const minDate = minRow ? String((minRow as any).local_date).slice(0,10) : null
      const maxDate = maxRow ? String((maxRow as any).local_date).slice(0,10) : null
      try {
        console.log('[wearable-status] since=all head count result:', {
          exactCount,
          minDate,
          maxDate,
          sources: Array.from(sourcesSet)
        })
      } catch {}
      return NextResponse.json({
        wearable_connected: (exactCount || 0) > 0,
        wearable_sources: Array.from(sourcesSet),
        wearable_days_imported: exactCount || 0,
        wearable_metrics: [],
        wearable_first_upload_at: null,
        wearable_last_upload_at: null,
        wearable_date_range_start: minDate,
        wearable_date_range_end: maxDate,
        days_by_source: daysBySource,
        checkin_days: checkinCount || 0,
        total_unique_days: exactCount || 0,
        overlap_days: 0
      })
    } else {
      try { console.log('[wearable-status] ENTER 2yr window branch for user', (user as any)?.id) } catch {}
      const since = new Date()
      if (sinceParam) {
        // Expect YYYY-MM-DD
        const d = new Date(sinceParam)
        if (!isNaN(+d)) since.setTime(d.getTime())
        else since.setFullYear(since.getFullYear() - 2)
      } else {
        since.setFullYear(since.getFullYear() - 2)
      }
      const q = await supabase
        .from('daily_entries')
        .select('local_date, wearables, created_at, energy, mood, focus, sleep_quality')
        .eq('user_id', user.id)
        .gte('local_date', since.toISOString().slice(0,10))
        .order('local_date', { ascending: false }) // newest first so we hit recent manual entries within row cap
      rows = q.data as any[] | null
      qErr = q.error
      try {
        console.log('[wearable-status] 2yr window result:', {
          error: qErr?.message || 'none',
          rowCount: (rows || []).length,
          since: since.toISOString().slice(0,10),
          first: rows && rows[rows.length - 1] ? { local_date: String((rows[rows.length - 1] as any).local_date).slice(0,10) } : 'NONE',
          last: rows && rows[0] ? { local_date: String((rows[0] as any).local_date).slice(0,10) } : 'NONE'
        })
      } catch {}
    }
    if (qErr) {
      try { console.error('[wearable-status] Query error:', qErr.message) } catch {}
    }

    const wearableDays = new Set<string>()
    const checkinDays = new Set<string>()
    const overlapDays = new Set<string>()
    const metrics = new Set<string>()
    const sources = new Map<string, number>()
    let firstUploadAt: string | null = null
    let lastUploadAt: string | null = null
    let startDate: string | null = null
    let endDate: string | null = null
    // Track any wearable object presence (even if metrics are null) for date range accuracy
    let anyWearableStart: string | null = null
    let anyWearableEnd: string | null = null

    const manualDates: string[] = []
    const manualTimestamps: string[] = []
    let energyCount = 0, focusCount = 0, moodCount = 0
    for (const r of rows || []) {
      const d = String((r as any).local_date).slice(0,10)
      const w = (r as any).wearables || null
      const created = (r as any).created_at || null
      // Count ANY non-empty wearables object (older data may use different keys/types)
      const hasWearable = w && typeof w === 'object' && Object.keys(w).length > 0
      const hasWearableObject = w && typeof w === 'object'
      // Manual check-in logic (strict): only count true app check-ins
      // Manual day = user provided any of energy / focus / mood.
      // Do NOT infer manual from sleep_quality (can be imported).
      const hasEnergy = (r as any).energy != null
      const hasFocus = (r as any).focus != null
      const hasMood = (r as any).mood != null
      if (hasEnergy) energyCount++
      if (hasFocus) focusCount++
      if (hasMood) moodCount++
      const manual = hasEnergy || hasFocus || hasMood
      if (manual) {
        checkinDays.add(d)
        manualDates.push(d)
        if (created) manualTimestamps.push(String(created))
      }
      if (hasWearable) {
        wearableDays.add(d)
        const src = typeof w.source === 'string' && w.source ? String(w.source) : 'Wearable'
        sources.set(src, (sources.get(src) || 0) + 1)
        if (w.hrv_sdnn_ms != null || w.hrv != null || w.hrv_ms != null || w.hrv_rmssd != null) metrics.add('HRV')
        if (w.resting_hr_bpm != null || w.resting_hr != null || w.rhr != null) metrics.add('Resting HR')
        if (w.sleep_min != null || w.sleep_hours != null || w.deep_sleep_min != null || w.rem_sleep_min != null) metrics.add('Sleep')
        if (!firstUploadAt || (created && String(created) < firstUploadAt)) firstUploadAt = String(created || d)
        if (!lastUploadAt || (created && String(created) > lastUploadAt)) lastUploadAt = String(created || d)
        if (!startDate || d < startDate) startDate = d
        if (!endDate || d > endDate) endDate = d
      }
      // For date range, also consider any wearable object (even if metrics are null)
      if (hasWearableObject) {
        const srcAny = typeof w.source === 'string' && w.source ? String(w.source) : 'Wearable'
        sources.set(srcAny, (sources.get(srcAny) || 0) + 0) // ensure presence
        if (!anyWearableStart || d < anyWearableStart) anyWearableStart = d
        if (!anyWearableEnd || d > anyWearableEnd) anyWearableEnd = d
      }
      if (hasWearable && manual) overlapDays.add(d)
    }

    const debug = url.searchParams.get('debug') === '1'
    const payload: any = {
      wearable_connected: wearableDays.size > 0,
      wearable_sources: Array.from(sources.keys()),
      wearable_days_imported: wearableDays.size,
      wearable_metrics: Array.from(metrics),
      wearable_first_upload_at: firstUploadAt,
      wearable_last_upload_at: lastUploadAt,
      wearable_date_range_start: anyWearableStart || startDate,
      wearable_date_range_end: anyWearableEnd || endDate,
      days_by_source: Object.fromEntries(sources),
      checkin_days: checkinDays.size,
      total_unique_days: new Set<string>([...wearableDays, ...checkinDays]).size,
      overlap_days: overlapDays.size
    }
    if (debug) {
      // Include light debug info only
      const samples: any[] = []
      let added = 0
      for (const r of rows || []) {
        const w = (r as any).wearables || null
        if (w && typeof w === 'object') {
          samples.push({
            date: String((r as any).local_date).slice(0,10),
            keys: Object.keys(w),
          })
          added++
          if (added >= 5) break
        }
      }
      const manualUnique = new Set<string>(manualDates).size
      const manualSorted = manualTimestamps.sort()
      try {
        // eslint-disable-next-line no-console
        console.log('[wearable-status][debug]', {
          since: sinceParam === 'all' ? 'all' : 'windowed',
          totalRows: (rows || []).length,
          energyCount, focusCount, moodCount,
          checkinDays: checkinDays.size,
          wearableDays: wearableDays.size
        })
      } catch {}
      payload.debug = {
        rows: (rows || []).length,
        wearableDays: wearableDays.size,
        checkinDays: checkinDays.size,
        overlapDays: overlapDays.size,
        totalUniqueDays: payload.total_unique_days,
        sample: samples,
        manualRows: manualDates.length,
        manualUniqueDays: manualUnique,
        firstCheckin: manualSorted[0] || null,
        lastCheckin: manualSorted[manualSorted.length - 1] || null
      }
    }
    return NextResponse.json(payload)
  } catch (e: any) {
    return NextResponse.json({ wearable_connected: false, error: e?.message || 'error' }, { status: 200 })
  }
}


