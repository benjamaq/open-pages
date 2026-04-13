import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cohortParticipantUserIdCandidatesSync } from '@/lib/cohortParticipantUserId'
import { countDistinctDailyEntriesSinceForUserIds } from '@/lib/cohortCheckinCount'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendCohortStudyStartEmail } from '@/lib/cohortStudyStartEmail'
import { cohortUsesStoreCreditPartnerReward, storeCreditTitleFromCohortRow } from '@/lib/cohortStudyLandingRewards'

export const dynamic = 'force-dynamic'

type ArrivalChoice = 'today' | 'yesterday' | 'few_days_ago' | 'skip'

function ymdAddDays(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + delta)
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function utcNoonIso(ymd: string): string {
  return `${ymd}T12:00:00.000Z`
}

/** Start of calendar day in UTC (00:00:00). Used when first study day must include morning check-ins the next day. */
function utcStartOfDayIso(ymd: string): string {
  return `${ymd}T00:00:00.000Z`
}

/** Yesterday through five days ago (inclusive), for "when did you first take it". */
function validFirstDoseYmds(todayYmd: string): string[] {
  const out: string[] = []
  for (let i = 1; i <= 5; i++) {
    out.push(ymdAddDays(todayYmd, -i))
  }
  return out
}

function productArrivedAtForChoice(choice: ArrivalChoice, todayYmd: string, firstDoseYmd: string | null): string | null {
  switch (choice) {
    case 'today':
      return todayYmd
    case 'yesterday':
      return ymdAddDays(todayYmd, -1)
    case 'few_days_ago':
      return firstDoseYmd
    case 'skip':
    default:
      return null
  }
}

/**
 * Confirmed participant: product arrived → start 21-day study clock (+ optional first check-in).
 * Body: {
 *   productArrived?: 'today' | 'yesterday' | 'few_days_ago' | 'skip'
 *   tookProductLastNight?: boolean  // required when productArrived === 'yesterday'
 *   firstDoseYmd?: string          // YYYY-MM-DD, required when productArrived === 'few_days_ago'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()
    if (authErr || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const raw = body?.productArrived
    const choice: ArrivalChoice =
      raw === 'today' || raw === 'yesterday' || raw === 'few_days_ago' || raw === 'skip' ? raw : 'skip'

    const calRaw = typeof body?.calendarTodayYmd === 'string' ? String(body.calendarTodayYmd).trim() : ''
    const todayYmd =
      calRaw && /^\d{4}-\d{2}-\d{2}$/.test(calRaw) ? calRaw : new Date().toISOString().slice(0, 10)
    const tookLastNight = body?.tookProductLastNight
    const firstDoseRaw =
      typeof body?.firstDoseYmd === 'string' ? String(body.firstDoseYmd).trim().slice(0, 10) : ''

    if (choice === 'yesterday') {
      if (tookLastNight !== true && tookLastNight !== false) {
        return NextResponse.json({ error: 'tookProductLastNight required for yesterday' }, { status: 400 })
      }
    }
    if (choice === 'few_days_ago') {
      const allowed = new Set(validFirstDoseYmds(todayYmd))
      if (!firstDoseRaw || !allowed.has(firstDoseRaw)) {
        return NextResponse.json({ error: 'firstDoseYmd must be one of the last 5 days before today' }, { status: 400 })
      }
    }

    const { data: prof, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('id, cohort_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (pErr || !prof?.id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
    }
    const profileId = String((prof as { id: string }).id)
    const cpUserIds = cohortParticipantUserIdCandidatesSync(profileId, user.id)
    const cohortSlug =
      (prof as { cohort_id?: string | null }).cohort_id != null
        ? String((prof as { cohort_id: string }).cohort_id).trim()
        : ''
    if (!cohortSlug) {
      return NextResponse.json({ error: 'No cohort' }, { status: 400 })
    }

    const { data: cohortRow, error: cErr } = await supabaseAdmin
      .from('cohorts')
      .select('id, product_name, brand_name, study_days, study_landing_reward_config, checkin_fields')
      .eq('slug', cohortSlug)
      .maybeSingle()
    if (cErr || !cohortRow?.id) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 400 })
    }
    const cohortUuid = String((cohortRow as { id: string }).id)
    const productName =
      (cohortRow as { product_name?: string | null }).product_name != null
        ? String((cohortRow as { product_name: string }).product_name).trim()
        : 'Study product'
    const partnerBrandName = String(
      (cohortRow as { brand_name?: string | null }).brand_name ?? '',
    ).trim()
    const studyDaysRaw = (cohortRow as { study_days?: number | null }).study_days
    const studyDurationDays =
      typeof studyDaysRaw === 'number' && Number.isFinite(studyDaysRaw) && studyDaysRaw > 0
        ? Math.floor(studyDaysRaw)
        : 21

    const storeCreditPartnerReward = cohortUsesStoreCreditPartnerReward(
      cohortRow as { study_landing_reward_config?: unknown; checkin_fields?: unknown },
    )
    const storeCreditTitle = storeCreditTitleFromCohortRow(
      cohortRow as { study_landing_reward_config?: unknown; checkin_fields?: unknown },
    )

    const { data: part, error: partErr } = await supabaseAdmin
      .from('cohort_participants')
      .select('id, status, confirmed_at, study_started_at, enrolled_at')
      .in('user_id', cpUserIds)
      .eq('cohort_id', cohortUuid)
      .maybeSingle()

    if (partErr || !part?.id) {
      return NextResponse.json({ error: 'Not a study participant' }, { status: 400 })
    }
    const status = String((part as { status: string }).status)
    const confirmedAt = (part as { confirmed_at?: string | null }).confirmed_at
    const startedAt = (part as { study_started_at?: string | null }).study_started_at

    if (status !== 'confirmed' || !confirmedAt) {
      return NextResponse.json({ error: 'Study not confirmed yet' }, { status: 400 })
    }
    if (startedAt != null && String(startedAt).trim() !== '') {
      return NextResponse.json({ error: 'Study already started' }, { status: 400 })
    }

    const enrolledAtRaw = (part as { enrolled_at?: string | null }).enrolled_at
    const enrolledAt = enrolledAtRaw != null && String(enrolledAtRaw).trim() !== '' ? String(enrolledAtRaw).trim() : ''
    if (!enrolledAt) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 400 })
    }
    const confirmedAtIso =
      confirmedAt != null && String(confirmedAt).trim() !== ''
        ? String(confirmedAt).trim()
        : ''
    const confirmYmd = confirmedAtIso.slice(0, 10)
    const baselineDistinctDays = await countDistinctDailyEntriesSinceForUserIds(
      cpUserIds,
      confirmedAtIso || enrolledAt,
      { excludeLocalDatesOnOrBeforeYmd: confirmYmd },
    )
    if (baselineDistinctDays < 3) {
      return NextResponse.json(
        { error: 'You must complete 3 baseline check-ins before starting the study' },
        { status: 400 },
      )
    }

    let studyStartedIso: string
    let openCheckin = false
    const firstDoseYmd = choice === 'few_days_ago' ? firstDoseRaw : null

    switch (choice) {
      case 'today':
        studyStartedIso = utcStartOfDayIso(ymdAddDays(todayYmd, 1))
        openCheckin = false
        break
      case 'yesterday':
        if (tookLastNight === true) {
          // First dose was last night; Day 1 of the 21-day window is today's check-in day (not yesterday), so anchor the clock to today 00:00 UTC.
          studyStartedIso = utcStartOfDayIso(todayYmd)
          openCheckin = true
        } else {
          // Same as `today`: first dose is tonight — study clock is next calendar day from 00:00 UTC so morning check-ins count as Day 1.
          studyStartedIso = utcStartOfDayIso(ymdAddDays(todayYmd, 1))
          openCheckin = false
        }
        break
      case 'few_days_ago':
        studyStartedIso = utcNoonIso(firstDoseYmd!)
        openCheckin = true
        break
      case 'skip':
      default:
        studyStartedIso = new Date().toISOString()
        openCheckin = true
        break
    }

    const arrived = productArrivedAtForChoice(choice, todayYmd, firstDoseYmd)
    const patch: Record<string, unknown> = {
      study_started_at: studyStartedIso,
    }
    if (arrived) {
      patch.product_arrived_at = arrived
    }

    const { error: upErr } = await supabaseAdmin
      .from('cohort_participants')
      .update(patch)
      .eq('id', (part as { id: string }).id)
      .is('study_started_at', null)

    if (upErr) {
      console.error('[cohort/start-study] update', upErr)
      return NextResponse.json({ error: 'Could not start study' }, { status: 500 })
    }

    const email = String(user.email || '').trim()
    const firstNightDeferPath =
      choice === 'today' || (choice === 'yesterday' && tookLastNight === false)
    const sendStartEmail = !firstNightDeferPath
    if (email && sendStartEmail) {
      const r = await sendCohortStudyStartEmail({
        to: email,
        authUserId: user.id,
        productName,
        partnerBrandName: partnerBrandName || null,
        cohortSlug,
        studyDurationDays,
        storeCreditPartnerReward,
        storeCreditTitle: storeCreditTitle ?? undefined,
      })
      if (!r.success) {
        console.warn('[cohort/start-study] email', r.error)
      }
    }

    return NextResponse.json({ ok: true, openCheckin })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed'
    console.error('[cohort/start-study]', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
