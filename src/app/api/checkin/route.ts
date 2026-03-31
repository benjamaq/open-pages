import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { normalizeCohortCheckinFields } from '@/lib/cohortCheckinFields'
import { tryImmediateCohortComplianceConfirm } from '@/lib/cohortComplianceConfirmed'

function parseClientLocalDateYmd(body: Record<string, unknown> | null | undefined): string {
  const raw = body?.local_date
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  return new Date().toISOString().slice(0, 10)
}

function ymdAddCalendarDays(ymd: string, deltaDays: number): string {
  const parts = ymd.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return ymd
  const [y, m, d] = parts
  const ms = Date.UTC(y, m - 1, d) + deltaDays * 86400000
  const t = new Date(ms)
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ── COHORT BRANCH (participants with profiles.cohort_id set) ───────────────
    // Early return only here — standard path and validation below are unchanged.
    // Truth engine: primary metric extraction prefers sleep_quality when present;
    // mood/focus nulls are not used in that path. Fallback chain uses _raw wearables
    // then subjective fields only if earlier sources missing — verify in QA for cohort rows.
    const { data: cohortProfileRow } = await supabase
      .from('profiles')
      .select('cohort_id')
      .eq('user_id', user.id)
      .maybeSingle()

    const cohortSlugRaw = (cohortProfileRow as { cohort_id?: string | null } | null)?.cohort_id
    const cohortSlug = cohortSlugRaw != null ? String(cohortSlugRaw).trim() : ''
    if (cohortSlug) {
      const cohortBody = (await request.json().catch(() => ({}))) as Record<string, unknown>
      const clamp10 = (v: unknown): number | null => {
        const n = Number(v)
        if (!Number.isFinite(n)) return null
        return Math.max(1, Math.min(10, Math.round(n)))
      }
      let checkinFields = normalizeCohortCheckinFields(null)
      try {
        const { data: cdef } = await supabase
          .from('cohorts')
          .select('checkin_fields')
          .eq('slug', cohortSlug)
          .maybeSingle()
        if (cdef != null && Array.isArray((cdef as { checkin_fields?: unknown }).checkin_fields)) {
          checkinFields = normalizeCohortCheckinFields(
            (cdef as { checkin_fields: unknown }).checkin_fields
          )
        }
      } catch {
        /* use default fields */
      }
      const sliderKeys = ['sleep_quality', 'energy', 'mood', 'focus'] as const
      for (const k of sliderKeys) {
        if (!checkinFields.includes(k)) continue
        if (clamp10(cohortBody[k]) == null) {
          return NextResponse.json({ error: `Missing required cohort field: ${k}` }, { status: 400 })
        }
      }
      const sobRaw = cohortBody.sleep_onset_bucket
      const nwRaw = cohortBody.night_wakes
      if (checkinFields.includes('sleep_onset_bucket')) {
        if (sobRaw !== undefined && sobRaw !== null && ![1, 2, 3, 4].includes(Number(sobRaw))) {
          return NextResponse.json({ error: 'Invalid sleep_onset_bucket value' }, { status: 400 })
        }
      }
      if (checkinFields.includes('night_wakes')) {
        if (nwRaw !== undefined && nwRaw !== null && ![0, 1, 2].includes(Number(nwRaw))) {
          return NextResponse.json({ error: 'Invalid night_wakes value' }, { status: 400 })
        }
      }
      const localDate = parseClientLocalDateYmd(cohortBody)
      const sleep_onset_bucket =
        sobRaw === undefined || sobRaw === null ? null : (Number(sobRaw) as 1 | 2 | 3 | 4)
      const night_wakes =
        nwRaw === undefined || nwRaw === null ? null : (Number(nwRaw) as 0 | 1 | 2)

      const tagsRaw = (cohortBody as { tags?: unknown }).tags
      const normalizedCohortTags: string[] = Array.isArray(tagsRaw)
        ? (tagsRaw as unknown[]).map((t) => String(t).toLowerCase()).filter(Boolean)
        : []
      const finalCohortTags = normalizedCohortTags.includes('clean_day') ? [] : normalizedCohortTags

      const cohortDePayload: Record<string, unknown> = {
        user_id: user.id,
        local_date: localDate,
        tags: finalCohortTags.length > 0 ? finalCohortTags : null,
      }
      const allCohortKeys = ['sleep_quality', 'energy', 'mood', 'focus', 'sleep_onset_bucket', 'night_wakes'] as const
      for (const k of allCohortKeys) {
        if (!checkinFields.includes(k)) {
          cohortDePayload[k] = null
          continue
        }
        if (k === 'sleep_onset_bucket') {
          cohortDePayload[k] = sleep_onset_bucket
        } else if (k === 'night_wakes') {
          cohortDePayload[k] = night_wakes
        } else {
          cohortDePayload[k] = clamp10(cohortBody[k])
        }
      }

      const { error: cohortDeErr } = await supabaseAdmin
        .from('daily_entries')
        .upsert(cohortDePayload, { onConflict: 'user_id,local_date' })

      if (cohortDeErr) {
        return NextResponse.json({ error: cohortDeErr.message }, { status: 500 })
      }

      try {
        const todayStr = localDate
        const yesterdayStr = ymdAddCalendarDays(localDate, -1)
        const { data: prof } = await supabase
          .from('profiles')
          .select('id,current_streak,last_checkin_date,first_activity_date')
          .eq('user_id', user.id)
          .maybeSingle()
        if (prof && (prof as any).id) {
          let currentStreak = Number((prof as any).current_streak || 0) || 0
          const lastDate: string | null = (prof as any).last_checkin_date || null
          if (lastDate !== todayStr) {
            if (lastDate === yesterdayStr) currentStreak += 1
            else currentStreak = 1
          }
          await (supabase as any)
            .from('profiles')
            .update({
              current_streak: currentStreak,
              last_checkin_date: todayStr,
              first_activity_date: (prof as any).first_activity_date || todayStr,
            } as any)
            .eq('id', (prof as any).id)
        }
      } catch {
        /* ignore streak errors for cohort */
      }

      try {
        const del = await supabaseAdmin.from('dashboard_cache').delete().eq('user_id', user.id)
        if ((del as any)?.error) throw (del as any).error
      } catch (e) {
        try {
          await supabaseAdmin
            .from('dashboard_cache')
            .update({ invalidated_at: new Date().toISOString() } as any)
            .eq('user_id', user.id)
        } catch {
          /* ignore */
        }
      }

      try {
        const { data: profForCompliance } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()
        const profileId = (profForCompliance as { id?: string } | null)?.id
        if (profileId) {
          await tryImmediateCohortComplianceConfirm({
            authUserId: user.id,
            profileId,
            cohortSlug,
          })
        }
      } catch (e) {
        console.error('[checkin] cohort compliance confirm hook', e)
      }

      return NextResponse.json({ success: true, cohort: true })
    }

    const body = await request.json().catch(() => ({}))
    try { console.log('[checkin] received body:', body) } catch {}
    let { mood, energy, focus, sleep, stress, tags, supplement_intake } = body || {}
    const localDate = parseClientLocalDateYmd(body || {})

    if (typeof energy !== 'number' || typeof focus !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Clamp incoming values to 1–10 and persist RAW 1–10 (no 3‑point mapping)
    const clamp10 = (v: any) => {
      const n = Number(v)
      if (!Number.isFinite(n)) return 0
      return Math.max(1, Math.min(10, Math.round(n)))
    }
    const energy10 = clamp10(energy)
    const focus10 = clamp10(focus)
    const sleep10 = typeof sleep === 'number' ? clamp10(sleep) : null
    // Mood is optional; if provided as number, clamp; otherwise leave null
    const mood10 = typeof mood === 'number' ? clamp10(mood) : null
    try { console.log('[checkin] normalized (1-10):', { energy10, focus10, sleep10, mood10 }) } catch {}

    // Values that will be written to both daily_entries and checkin (may fallback to 1–5 if DB constraints require)
    let energyWrite = energy10
    let focusWrite = focus10
    let moodWrite = mood10
    let sleepWrite = sleep10

    const payload: any = {
      user_id: user.id,
      mood: moodWrite,
      energy: energyWrite,
      focus: focusWrite,
      created_at: new Date().toISOString(),
      day: localDate,
    }
    if (typeof stress === 'string') {
      const s = String(stress).toLowerCase()
      if (['low', 'medium', 'high'].includes(s)) payload.stress_level = s
    }

    // Derive noise booleans from tags (for checkin row)
    try {
      const normalizedTags: string[] = Array.isArray(tags)
        ? (tags as any[]).map((t) => String(t).toLowerCase()).filter(Boolean)
        : []
      const finalTags = normalizedTags.includes('clean_day') ? [] : normalizedTags
      const has = (k: string) => finalTags.includes(k)
      payload.intense_exercise = !!has('intense_exercise')
      payload.new_supplement = !!has('new_supplement')
    } catch {}

    // Mirror/update daily_entries for this date (store tags, signals, supplement_intake) and collect micro-wins
    const microWins: string[] = []
    try {
      const normalizedTags: string[] = Array.isArray(tags)
        ? (tags as any[]).map((t) => String(t).toLowerCase()).filter(Boolean)
        : []
      // If "clean_day" present, prefer empty tags
      const finalTags = normalizedTags.includes('clean_day') ? [] : normalizedTags
      const intake =
        (supplement_intake && typeof supplement_intake === 'object')
          ? supplement_intake
          : null
      const dePayload = {
        user_id: user.id,
        local_date: localDate,
        mood: moodWrite,
        energy: energyWrite,
        focus: focusWrite,
        // Database column uses 'sleep_quality' in this schema
        ...(sleepWrite != null ? { sleep_quality: sleepWrite } : {}),
        tags: finalTags.length > 0 ? finalTags : null,
        supplement_intake: intake
      }
      let { data: deUpsert, error: deErr } = await supabaseAdmin
        .from('daily_entries')
        .upsert(dePayload, { onConflict: 'user_id,local_date' })
        .select('user_id,local_date,sleep_quality')
        .maybeSingle()
      try { console.log('[checkin] daily_entries upsert result:', { ok: !deErr, row: deUpsert, error: deErr }) } catch {}
      // Do not write to a non-existent 'sleep' column; schema uses 'sleep_quality'
      // If constraint error (e.g., CHECK 1..5), retry with scaled-to-5 values
      if (deErr && /check|constraint/i.test(deErr.message || '')) {
        try { console.log('[checkin] constraint error, retry with 1–5 mapping') } catch {}
        const to5 = (n: number | null) => n == null ? null : Math.max(1, Math.min(5, Math.round(n / 2)))
        energyWrite = to5(energy10) as number
        focusWrite = to5(focus10) as number
        moodWrite = to5(mood10 as any) as number | null
        sleepWrite = to5(sleep10 as any) as number | null
        const dePayloadRetry: any = {
          user_id: user.id,
          local_date: localDate,
          energy: energyWrite,
          focus: focusWrite,
          ...(moodWrite != null ? { mood: moodWrite } : {}),
          ...(sleepWrite != null ? { sleep_quality: sleepWrite } : {}),
          tags: finalTags.length > 0 ? finalTags : null,
          supplement_intake: intake
        }
        const retry = await supabaseAdmin
          .from('daily_entries')
          .upsert(dePayloadRetry, { onConflict: 'user_id,local_date' })
          .select('user_id,local_date,sleep_quality')
          .maybeSingle()
        deUpsert = retry.data as any
        deErr = retry.error as any
        try { console.log('[checkin] daily_entries retry result:', { ok: !deErr, row: deUpsert, error: deErr, values: { energyWrite, focusWrite, moodWrite, sleepWrite } }) } catch {}
      }
      if (deErr) {
        return NextResponse.json({ error: `Failed to save daily entry: ${deErr.message}` }, { status: 500 })
      }
      if (finalTags.length === 0) {
        microWins.push('✨ Clean day logged — signal strength improved')
      }
    } catch (e) {
      // non-fatal
      // eslint-disable-next-line no-console
      console.log('[checkin] daily_entries mirror failed', e)
    }

    // Update streak if profiles has columns; ignore if not present
    try {
      const todayStr = localDate
      const yesterdayStr = ymdAddCalendarDays(localDate, -1)
      const { data: prof } = await supabase
        .from('profiles')
        .select('id,current_streak,last_checkin_date,first_activity_date')
        .eq('user_id', user.id)
        .maybeSingle()
      if (prof && (prof as any).id) {
        let currentStreak = Number((prof as any).current_streak || 0) || 0
        const lastDate: string | null = (prof as any).last_checkin_date || null
        if (lastDate === todayStr) {
          // already checked in today
        } else if (lastDate === yesterdayStr) {
          currentStreak += 1
          microWins.push(`🔥 Streak: ${currentStreak} day${currentStreak === 1 ? '' : 's'}! Consistent data = clearer results`)
        } else {
          currentStreak = 1
          microWins.push('🎉 First check-in of this streak! Your testing has begun.')
        }
        await (supabase as any)
          .from('profiles')
          .update({
            current_streak: currentStreak,
            last_checkin_date: todayStr,
            first_activity_date: (prof as any).first_activity_date || todayStr
          } as any)
          .eq('id', (prof as any).id)
      }
    } catch (e) {}

    // Upsert by (user_id, day) so duplicate submissions update instead of insert
    // Debug log: attempt check-in upsert
    // eslint-disable-next-line no-console
    // Sync (potentially scaled) values into checkin row
    payload.energy = energyWrite
    payload.focus = focusWrite
    payload.mood = moodWrite
    try { console.log('[checkin] upsert payload:', payload) } catch {}
    const { data: upserted, error } = await supabase
      .from('checkin')
      .upsert(payload, { onConflict: 'user_id,day' })
      .select('id')
      .maybeSingle()
    // eslint-disable-next-line no-console
    console.log('[checkin] upsert result:', { ok: !error, id: (upserted as any)?.id, error })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // Invalidate dashboard cache so next dashboard load recomputes.
    // Use DELETE as the strongest invalidation (UPDATE can be a no-op if no row exists yet).
    try {
      const del = await supabaseAdmin
        .from('dashboard_cache')
        .delete()
        .eq('user_id', user.id)
      if ((del as any)?.error) throw (del as any).error
      try { console.log('[dashboard_cache] invalidated via delete', { userId: user.id }) } catch {}
    } catch (e) {
      try { console.log('[dashboard_cache] delete invalidate failed, fallback to update:', (e as any)?.message || e) } catch {}
      try {
        await supabaseAdmin
          .from('dashboard_cache')
          .update({ invalidated_at: new Date().toISOString() } as any)
          .eq('user_id', user.id)
      } catch (e2) { try { console.log('[dashboard_cache] update invalidate error (ignored):', (e2 as any)?.message || e2) } catch {} }
    }
    return NextResponse.json({ success: true, id: (upserted as any)?.id, upserted: true, micro_wins: microWins })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
