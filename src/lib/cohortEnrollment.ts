import { supabaseAdmin } from '@/lib/supabase/admin'
import { cohortParticipantUserIdCandidatesForProfile } from '@/lib/cohortParticipantUserId'
import {
  dailyEntryHasCohortStudyCheckinFields,
  dailyEntryIsExplicitUserCheckin,
} from '@/lib/explicitDailyCheckin'

function compactAlphaNum(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

/** Match stack / user_supplement display names to cohort `product_name` (handles retailer-long titles). */
export function displayNameMatchesCohortStudyProduct(
  displayName: string,
  productName: string,
  cohortSlug: string,
): boolean {
  const n = String(displayName || '').trim().toLowerCase()
  const pk = String(productName || '').trim().toLowerCase()
  const slug = String(cohortSlug || '').trim().toLowerCase()
  if (!n || !pk) return false
  if (n === pk) return true
  const nc = compactAlphaNum(displayName)
  const pc = compactAlphaNum(productName)
  if (pc.length >= 5 && nc.includes(pc)) return true
  if (nc.length >= 5 && pc.startsWith(nc)) return true
  const sc = compactAlphaNum(slug.replace(/-/g, ''))
  if (sc.length >= 8 && nc.includes(sc)) return true
  if (sc.length >= 8 && pc.length >= 8 && (sc.includes(pc) || pc.includes(sc))) return true
  return false
}

async function resolveHandoffCheckinIgnoreLocalDate(
  userId: string,
  clientYmd: string,
): Promise<string> {
  const selectCols =
    'local_date,mood,energy,focus,mental_clarity,calmness,sleep_onset_bucket'
  const { data: rows } = await supabaseAdmin
    .from('daily_entries')
    .select(selectCols)
    .eq('user_id', userId)
    .order('local_date', { ascending: false })
    .limit(120)
  for (const row of rows || []) {
    const r = row as Record<string, unknown>
    if (
      dailyEntryHasCohortStudyCheckinFields(r) &&
      dailyEntryIsExplicitUserCheckin(r)
    ) {
      const d = String((row as { local_date?: string }).local_date || '').slice(0, 10)
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
    }
  }
  for (const row of rows || []) {
    const r = row as Record<string, unknown>
    if (!dailyEntryIsExplicitUserCheckin(r)) continue
    const energy = (r as { energy?: unknown }).energy
    const focus = (r as { focus?: unknown }).focus
    const b2cOnly =
      typeof energy === 'number' &&
      typeof focus === 'number' &&
      !dailyEntryHasCohortStudyCheckinFields(r)
    if (b2cOnly) continue
    const d = String((row as { local_date?: string }).local_date || '').slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  }
  return clientYmd
}

async function listProfileIdsForUser(userId: string): Promise<string[]> {
  const uid = String(userId || '').trim()
  if (!uid) return []
  const { data: rows } = await supabaseAdmin.from('profiles').select('id').eq('user_id', uid)
  return (rows || [])
    .map((r) => String((r as { id?: string }).id || '').trim())
    .filter(Boolean)
}

/**
 * Same tie-break as /api/progress/loop: profile with the most stack_items
 * (profiles ordered newest first; keeps first among ties).
 */
export async function pickPrimaryProfileIdByStackCount(userId: string): Promise<string | null> {
  const uid = String(userId || '').trim()
  if (!uid) return null
  const { data: rows } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
  const ids = (rows || [])
    .map((r) => String((r as { id?: string }).id || '').trim())
    .filter(Boolean)
  if (ids.length === 0) return null
  if (ids.length === 1) return ids[0]
  let best = ids[0]
  let bestCount = -1
  for (const id of ids) {
    try {
      const { count } = await supabaseAdmin
        .from('stack_items')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', id)
      const c = Number(count || 0)
      if (c > bestCount) {
        bestCount = c
        best = id
      }
    } catch {
      /* ignore */
    }
  }
  return best
}

export type CohortHandoffRepairParams = {
  profileId: string
  userId: string
  productName: string
  cohortSlug: string
}

/** True when study stack rows or supplements still match the cohort product after a flagged cleanup (name mismatch on first pass). */
export async function needsCohortStudyStackRepair(
  params: CohortHandoffRepairParams,
): Promise<boolean> {
  const userId = String(params.userId || '').trim()
  let productName = String(params.productName || '').trim()
  const cohortSlug = String(params.cohortSlug || '').trim().toLowerCase()
  if (!userId || !cohortSlug) return false
  try {
    if (!productName) {
      const { data: cohort } = await supabaseAdmin
        .from('cohorts')
        .select('product_name')
        .eq('slug', cohortSlug)
        .maybeSingle()
      productName = String(
        (cohort as { product_name?: string } | null)?.product_name || '',
      ).trim()
    }
    if (!productName) return false

    const profileIds = await listProfileIdsForUser(userId)
    if (profileIds.length === 0) return false

    const { data: stacks } = await supabaseAdmin
      .from('stack_items')
      .select('id,name,user_supplement_id')
      .in('profile_id', profileIds)
    const { data: supps } = await supabaseAdmin
      .from('user_supplement')
      .select('id,name,is_active')
      .eq('user_id', userId)
    const usNameById = new Map<string, string>()
    for (const row of supps || []) {
      usNameById.set(
        String((row as { id: string }).id),
        String((row as { name?: string }).name || ''),
      )
    }
    for (const row of stacks || []) {
      const nm = String((row as { name?: string }).name || '')
      const usid = (row as { user_supplement_id?: string | null }).user_supplement_id
      const usName = usid ? usNameById.get(String(usid)) : undefined
      if (
        displayNameMatchesCohortStudyProduct(nm, productName, cohortSlug) ||
        (usName &&
          displayNameMatchesCohortStudyProduct(usName, productName, cohortSlug))
      ) {
        return true
      }
    }
    for (const row of supps || []) {
      const active = (row as { is_active?: boolean | null }).is_active
      const isActive = active !== false
      if (!isActive) continue
      const nm = String((row as { name?: string }).name || '')
      if (displayNameMatchesCohortStudyProduct(nm, productName, cohortSlug)) return true
    }
    return false
  } catch {
    return false
  }
}

export type CohortParticipantUpsertResult =
  | { ok: true }
  | { ok: false; error: string; code?: 'COHORT_FULL' | 'COHORT_INACTIVE' }

/** `profileId` = public.profiles.id; `cohortSlug` = public.cohorts.slug (same as profiles.cohort_id text). */
export async function ensureCohortStudyStackItem(profileId: string, cohortSlug: string) {
  const slug = String(cohortSlug || '').trim().toLowerCase()
  if (!slug || !profileId) return
  try {
    const { data: cohort, error: cErr } = await supabaseAdmin
      .from('cohorts')
      .select('product_name')
      .eq('slug', slug)
      .maybeSingle()
    if (cErr || !cohort) return
    const productName = String((cohort as { product_name?: string }).product_name || '').trim()
    if (!productName) return

    const { data: rows } = await supabaseAdmin
      .from('stack_items')
      .select('id,name')
      .eq('profile_id', profileId)
    const lower = productName.toLowerCase()
    const has = (rows || []).some((r: { name?: string }) => String(r?.name || '').trim().toLowerCase() === lower)
    if (has) return

    const { error: insErr } = await supabaseAdmin.from('stack_items').insert({
      profile_id: profileId,
      name: productName,
      item_type: 'supplement',
      frequency: 'daily',
      schedule_days: [0, 1, 2, 3, 4, 5, 6],
      created_at: new Date().toISOString(),
    } as any)
    if (insErr) {
      if (insErr.code === '23505') return
      console.error('[cohortEnrollment] stack_items insert:', insErr)
    }
  } catch (e) {
    console.error('[cohortEnrollment] ensureCohortStudyStackItem:', e)
  }
}

export async function upsertCohortParticipant(
  profileId: string,
  cohortSlug: string | null,
  qualificationResponse?: string | null
): Promise<CohortParticipantUpsertResult> {
  const slug = cohortSlug != null ? String(cohortSlug).trim().toLowerCase() : ''
  if (!profileId) {
    return { ok: false, error: 'Missing profile id' }
  }
  if (!slug) {
    return { ok: false, error: 'Missing cohort slug' }
  }
  const qRaw = qualificationResponse != null ? String(qualificationResponse).trim() : ''
  const qualificationStored = qRaw !== '' ? qRaw : null
  try {
    const { data: cohortRow, error: cohortErr } = await supabaseAdmin
      .from('cohorts')
      .select('id, status')
      .eq('slug', slug)
      .maybeSingle()
    if (cohortErr) {
      console.error('[cohortEnrollment] cohort lookup:', cohortErr)
      return { ok: false, error: cohortErr.message || 'Cohort lookup failed' }
    }
    if (!cohortRow?.id) {
      console.warn('[cohortEnrollment] cohort slug not found:', slug)
      return { ok: false, error: `Cohort not found for slug: ${slug}` }
    }
    const cohortStatus = String((cohortRow as { status?: string | null }).status || '')
      .trim()
      .toLowerCase()
    if (cohortStatus !== 'active') {
      return {
        ok: false,
        error: 'This study is not open for enrollment.',
        code: 'COHORT_INACTIVE',
      }
    }
    const cohortId = String((cohortRow as { id: string }).id)
    const enrolledAt = new Date().toISOString()
    const candidates = await cohortParticipantUserIdCandidatesForProfile(profileId)
    if (candidates.length === 0) {
      return { ok: false, error: 'Could not resolve profile for cohort enrollment' }
    }

    const basePayload = {
      cohort_id: cohortId,
      status: 'applied' as const,
      enrolled_at: enrolledAt,
      currently_taking_product: false,
      qualification_response: qualificationStored,
    }

    let conflicted = false
    let lastFkMessage: string | null = null

    for (const uid of candidates) {
      const { error: insErr } = await supabaseAdmin
        .from('cohort_participants')
        .insert({ ...basePayload, user_id: uid })
      if (!insErr) return { ok: true }
      if (
        insErr.code === '23514' ||
        (insErr.message && insErr.message.includes('COHORT_FULL')) ||
        (typeof insErr.details === 'string' && insErr.details.includes('COHORT_FULL'))
      ) {
        return {
          ok: false,
          error: 'This study has reached enrollment capacity.',
          code: 'COHORT_FULL',
        }
      }
      if (insErr.code === '23505') {
        conflicted = true
        break
      }
      if (insErr.code === '23503') {
        lastFkMessage = insErr.message
        continue
      }
      console.error('[cohortEnrollment] cohort_participants insert:', insErr)
      return { ok: false, error: insErr.message || 'Could not create cohort participant' }
    }

    const updatePatch: Record<string, unknown> = {
      currently_taking_product: false,
      qualification_response: qualificationStored,
    }
    if (conflicted) {
      for (const uid of candidates) {
        const { error: upErr } = await supabaseAdmin
          .from('cohort_participants')
          .update(updatePatch as Record<string, unknown>)
          .eq('user_id', uid)
          .eq('cohort_id', cohortId)
        if (!upErr) return { ok: true }
      }
      console.error('[cohortEnrollment] cohort_participants update: no row matched candidates')
      return { ok: false, error: 'Could not update cohort participant' }
    }

    if (lastFkMessage) {
      console.error('[cohortEnrollment] cohort_participants insert:', lastFkMessage)
      return { ok: false, error: lastFkMessage || 'Could not create cohort participant' }
    }
    return { ok: false, error: 'Could not create cohort participant' }
  } catch (e) {
    console.error('[cohortEnrollment] upsertCohortParticipant:', e)
    return { ok: false, error: e instanceof Error ? e.message : 'Cohort enrollment failed' }
  }
}

/**
 * After study completion + Pro: remove cohort study stack rows and matching user_supplement rows
 * (fuzzy match on display name vs cohort product_name); set handoff ignore date from the last
 * cohort-style daily_entries day so `/api/progress/loop` does not treat the last study check-in
 * as "checked in today" on the B2C dashboard.
 */
export async function runCohortMainProductHandoffCleanup(params: {
  profileId: string
  userId: string
  cohortSlug: string
  productName: string
  clientTodayYmd: string
}): Promise<void> {
  const primaryProfileId = String(params.profileId || '').trim()
  const userId = String(params.userId || '').trim()
  const slug = String(params.cohortSlug || '').trim().toLowerCase()
  let productName = String(params.productName || '').trim()
  const clientYmd = String(params.clientTodayYmd || '').trim()
  if (!userId || !slug || !clientYmd || !/^\d{4}-\d{2}-\d{2}$/.test(clientYmd)) {
    return
  }
  try {
    if (!productName) {
      const { data: cohort } = await supabaseAdmin
        .from('cohorts')
        .select('product_name')
        .eq('slug', slug)
        .maybeSingle()
      productName = String((cohort as { product_name?: string } | null)?.product_name || '').trim()
    }
    if (!productName) return

    const ignoreYmd = await resolveHandoffCheckinIgnoreLocalDate(userId, clientYmd)

    const { data: supps } = await supabaseAdmin
      .from('user_supplement')
      .select('id,name')
      .eq('user_id', userId)
    const matchingUsIds = new Set<string>()
    for (const row of supps || []) {
      const id = (row as { id?: string }).id
      const nm = String((row as { name?: string }).name || '')
      if (!id) continue
      if (displayNameMatchesCohortStudyProduct(nm, productName, slug)) {
        matchingUsIds.add(String(id))
      }
    }

    const profileIdsForUser = [
      ...new Set(
        [...(await listProfileIdsForUser(userId)), primaryProfileId].filter(Boolean),
      ),
    ]
    for (const pid of profileIdsForUser) {
      const { data: stacks } = await supabaseAdmin
        .from('stack_items')
        .select('id,name,user_supplement_id')
        .eq('profile_id', pid)
      for (const row of stacks || []) {
        const sid = String((row as { id?: string }).id || '')
        if (!sid) continue
        const nm = String((row as { name?: string }).name || '')
        const usid = (row as { user_supplement_id?: string | null }).user_supplement_id
        const usKey = usid ? String(usid) : ''
        const hitName = displayNameMatchesCohortStudyProduct(nm, productName, slug)
        const hitUs = usKey && matchingUsIds.has(usKey)
        if (!hitName && !hitUs) continue
        await supabaseAdmin.from('stack_items').delete().eq('id', sid)
      }
    }

    for (const id of matchingUsIds) {
      const { error: delErr } = await supabaseAdmin
        .from('user_supplement')
        .delete()
        .eq('id', id)
      if (delErr) {
        await supabaseAdmin
          .from('user_supplement')
          .update({ is_active: false } as Record<string, unknown>)
          .eq('id', id)
      }
    }

    const cleanedAt = new Date().toISOString()
    const profilePatch = {
      cohort_study_stack_cleaned_at: cleanedAt,
      cohort_handoff_checkin_ignore_local_date: ignoreYmd,
    } as Record<string, unknown>
    for (const pid of profileIdsForUser) {
      await supabaseAdmin.from('profiles').update(profilePatch).eq('id', pid)
    }

    try {
      await supabaseAdmin.from('dashboard_cache').delete().eq('user_id', userId)
    } catch {
      /* ignore */
    }
  } catch (e) {
    console.error('[cohortEnrollment] runCohortMainProductHandoffCleanup:', e)
  }
}

/**
 * Run stack / supplement / handoff-date cleanup immediately after Pro claim (or idempotent re-run if already claimed).
 * `/api/me` also runs `runCohortMainProductHandoffCleanup` when eligible, but claim must not depend on the next
 * dashboard load — otherwise B2C shows cohort stack and check-in residue after redirect.
 */
export async function runCohortHandoffAfterProClaim(params: {
  authUserId: string
  cohortParticipantId: string
  clientTodayYmd?: string
}): Promise<void> {
  const uid = String(params.authUserId || '').trim()
  const cpRowId = String(params.cohortParticipantId || '').trim()
  if (!uid || !cpRowId) return
  const ymd =
    params.clientTodayYmd && /^\d{4}-\d{2}-\d{2}$/.test(params.clientTodayYmd)
      ? params.clientTodayYmd
      : new Date().toISOString().slice(0, 10)

  try {
    const { data: part, error: pErr } = await supabaseAdmin
      .from('cohort_participants')
      .select('cohort_id')
      .eq('id', cpRowId)
      .maybeSingle()
    if (pErr || !(part as { cohort_id?: string } | null)?.cohort_id) {
      console.warn('[cohortEnrollment] handoff after claim: participant', cpRowId, pErr?.message)
      return
    }
    const cohortUuid = String((part as { cohort_id: string }).cohort_id)

    const { data: cohort, error: cErr } = await supabaseAdmin
      .from('cohorts')
      .select('slug, product_name')
      .eq('id', cohortUuid)
      .maybeSingle()
    if (cErr || !cohort) {
      console.warn('[cohortEnrollment] handoff after claim: cohort', cohortUuid, cErr?.message)
      return
    }

    const slug = String((cohort as { slug?: string }).slug || '').trim().toLowerCase()
    const productName = String((cohort as { product_name?: string }).product_name || '').trim()
    if (!slug) return

    const profileId = (await pickPrimaryProfileIdByStackCount(uid)) || ''
    if (!profileId) {
      console.warn('[cohortEnrollment] handoff after claim: no primary profile', uid)
      return
    }

    await runCohortMainProductHandoffCleanup({
      profileId,
      userId: uid,
      cohortSlug: slug,
      productName,
      clientTodayYmd: ymd,
    })
  } catch (e) {
    console.error('[cohortEnrollment] runCohortHandoffAfterProClaim:', e)
  }
}
