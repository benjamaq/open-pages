import { NextRequest, NextResponse } from 'next/server'
import {
  cohortStudyDistinctCheckinDaysSinceStart,
  cohortStudyWindowElapsed,
  MIN_STUDY_CHECKINS_FOR_COMPLETION,
} from '@/lib/cohortStudyCompletion'
import { sendCohortResultReadyEmail } from '@/lib/cohortResultReadyEmail'
import { sendCohortStudyCompletionEmail } from '@/lib/cohortStudyCompletionEmail'
import {
  cohortParticipantUserIdCandidatesSync,
  fetchProfilesByCohortParticipantUserIds,
  authUserIdFromCohortParticipantProfileMap,
} from '@/lib/cohortParticipantUserId'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ensureCohortRewardClaimToken } from '@/lib/cohortRewardClaimDb'
import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import { cohortUsesStoreCreditPartnerReward, storeCreditTitleFromCohortRow } from '@/lib/cohortStudyLandingRewards'

export const dynamic = 'force-dynamic'

function assertCron(request: NextRequest): NextResponse | null {
  const url = new URL(request.url)
  const header = request.headers.get('authorization') || ''
  const vercelCron = request.headers.get('x-vercel-cron')
  const param = url.searchParams.get('key') || ''
  const secret = process.env.CRON_SECRET || ''
  const okHeader = header === `Bearer ${secret}`
  const okParam = param === secret && secret.length > 0
  const okVercel = !!vercelCron
  if (!secret && !okVercel) {
    return NextResponse.json({ error: 'Missing CRON_SECRET' }, { status: 401 })
  }
  if (!okHeader && !okParam && !okVercel) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

function utcTodayYmd(): string {
  return new Date().toISOString().slice(0, 10)
}

type CohortMeta = {
  slug: string | null
  study_days: number | null
  product_name: string | null
  brand_name: string | null
  study_landing_reward_config?: unknown
  checkin_fields?: unknown
}

async function resolveAuthEmail(authUserId: string): Promise<string | null> {
  const { data: row, error } = await supabaseAdmin.auth.admin.getUserById(authUserId)
  if (error || !row?.user?.email) return null
  return String(row.user.email).trim() || null
}

async function processCompletionPass(dry: boolean) {
  const todayYmd = utcTodayYmd()
  let completed = 0
  let completionEmails = 0
  const errors: string[] = []

  const { data: rows, error } = await supabaseAdmin
    .from('cohort_participants')
    .select('id, user_id, cohort_id, study_started_at, completion_email_sent_at')
    .eq('status', 'confirmed')
    .not('study_started_at', 'is', null)
    .is('study_completed_at', null)

  if (error) {
    console.error('[cohort-study-completion] load:', error)
    return { ok: false as const, error: error.message }
  }

  const list = (rows || []) as Array<{
    id: string
    user_id: string
    cohort_id: string
    study_started_at: string
    completion_email_sent_at: string | null
  }>

  const cohortIds = [...new Set(list.map((r) => r.cohort_id).filter(Boolean))]
  const cohortMap = new Map<string, CohortMeta>()
  if (cohortIds.length > 0) {
    const { data: cRows, error: cErr } = await supabaseAdmin
      .from('cohorts')
      .select(
        'id, slug, study_days, product_name, brand_name, study_landing_reward_config, checkin_fields',
      )
      .in('id', cohortIds)
    if (cErr) {
      console.error('[cohort-study-completion] cohorts:', cErr)
      return { ok: false as const, error: cErr.message }
    }
    for (const c of (cRows || []) as Array<CohortMeta & { id: string; slug?: string | null }>) {
      const slug =
        c.slug != null && String(c.slug).trim() !== '' ? String(c.slug).trim() : null
      cohortMap.set(c.id, { ...c, slug })
    }
  }

  const profMap = await fetchProfilesByCohortParticipantUserIds(list.map((r) => r.user_id))

  for (const row of list) {
    const cdef = cohortMap.get(row.cohort_id)
    const studyDays =
      cdef && typeof cdef.study_days === 'number' && cdef.study_days > 0 ? cdef.study_days : 21
    if (!cohortStudyWindowElapsed(todayYmd, row.study_started_at, studyDays)) continue

    const profRow = profMap.get(row.user_id)
    const entryUserIds = profRow
      ? cohortParticipantUserIdCandidatesSync(profRow.id, profRow.user_id)
      : [row.user_id]
    const checkinDaysSinceStart = await cohortStudyDistinctCheckinDaysSinceStart(
      entryUserIds,
      row.study_started_at,
    )
    if (checkinDaysSinceStart < MIN_STUDY_CHECKINS_FOR_COMPLETION) continue

    if (dry) {
      completed++
      continue
    }

    const { data: updated, error: upErr } = await supabaseAdmin
      .from('cohort_participants')
      .update({
        study_completed_at: new Date().toISOString(),
        status: 'completed',
      })
      .eq('id', row.id)
      .eq('status', 'confirmed')
      .is('study_completed_at', null)
      .select('id, completion_email_sent_at')
      .maybeSingle()

    if (upErr) {
      errors.push(`${row.id}: ${upErr.message}`)
      continue
    }
    if (!updated) continue
    completed++

    const rewardToken = await ensureCohortRewardClaimToken(String(updated.id))
    const rewardClaimAbsoluteUrl = rewardToken
      ? `${cohortEmailPublicOrigin()}/claim?token=${encodeURIComponent(rewardToken)}`
      : null
    if (!rewardToken) {
      console.warn('[cohort-study-completion] no reward claim token for participant', updated.id)
    }

    if (updated.completion_email_sent_at) continue

    const authId = authUserIdFromCohortParticipantProfileMap(row.user_id, profMap)
    if (!authId) {
      console.warn('[cohort-study-completion] no auth id for participant', row.id)
      continue
    }
    const email = await resolveAuthEmail(authId)
    if (!email) {
      console.warn('[cohort-study-completion] no email for user', authId)
      continue
    }

    const productName =
      (cdef?.product_name != null && String(cdef.product_name).trim() !== ''
        ? String(cdef.product_name).trim()
        : null) || 'your study'

    const storeCreditPartnerReward = cohortUsesStoreCreditPartnerReward(
      (cdef || {}) as { study_landing_reward_config?: unknown; checkin_fields?: unknown },
    )
    const storeCreditTitle = storeCreditTitleFromCohortRow(
      (cdef || {}) as { study_landing_reward_config?: unknown; checkin_fields?: unknown },
    )

    const send = await sendCohortStudyCompletionEmail({
      to: email,
      authUserId: authId,
      productName,
      partnerBrandName: cdef?.brand_name ?? null,
      cohortSlug: cdef?.slug ?? null,
      rewardClaimAbsoluteUrl,
      storeCreditPartnerReward,
      storeCreditTitle,
    })
    if (!send.success) {
      errors.push(`${row.id} email: ${send.error || 'send failed'}`)
      continue
    }

    const { error: flagErr } = await supabaseAdmin
      .from('cohort_participants')
      .update({ completion_email_sent_at: new Date().toISOString() })
      .eq('id', row.id)
      .is('completion_email_sent_at', null)

    if (flagErr) {
      errors.push(`${row.id} flag: ${flagErr.message}`)
    } else {
      completionEmails++
    }
  }

  return { ok: true as const, completed, completionEmails, errors }
}

/**
 * Second pass: participant already marked completed (e.g. manual DB / migration) but completion
 * thank-you was never sent. Does not touch status or study_completed_at.
 */
async function processCompletionEmailBackfillPass(dry: boolean) {
  let sent = 0
  const errors: string[] = []

  const { data: rows, error } = await supabaseAdmin
    .from('cohort_participants')
    .select('id, user_id, cohort_id, study_started_at')
    .eq('status', 'completed')
    .not('study_started_at', 'is', null)
    .not('study_completed_at', 'is', null)
    .is('completion_email_sent_at', null)

  if (error) {
    console.error('[cohort-study-completion] backfill load:', error)
    return { ok: false as const, error: error.message, sent: 0, errors }
  }

  const list = (rows || []) as Array<{
    id: string
    user_id: string
    cohort_id: string
    study_started_at: string
  }>

  const cohortIds = [...new Set(list.map((r) => r.cohort_id).filter(Boolean))]
  const cohortMap = new Map<string, CohortMeta>()
  if (cohortIds.length > 0) {
    const { data: cRows, error: cErr } = await supabaseAdmin
      .from('cohorts')
      .select(
        'id, slug, study_days, product_name, brand_name, study_landing_reward_config, checkin_fields',
      )
      .in('id', cohortIds)
    if (cErr) {
      console.error('[cohort-study-completion] backfill cohorts:', cErr)
      return { ok: false as const, error: cErr.message, sent: 0, errors }
    }
    for (const c of (cRows || []) as Array<CohortMeta & { id: string; slug?: string | null }>) {
      const slug =
        c.slug != null && String(c.slug).trim() !== '' ? String(c.slug).trim() : null
      cohortMap.set(c.id, { ...c, slug })
    }
  }

  const profMap = await fetchProfilesByCohortParticipantUserIds(list.map((r) => r.user_id))

  for (const row of list) {
    const cdef = cohortMap.get(row.cohort_id)

    if (dry) {
      sent++
      continue
    }

    const rewardToken = await ensureCohortRewardClaimToken(String(row.id))
    const rewardClaimAbsoluteUrl = rewardToken
      ? `${cohortEmailPublicOrigin()}/claim?token=${encodeURIComponent(rewardToken)}`
      : null
    if (!rewardToken) {
      console.warn('[cohort-study-completion] backfill: no reward claim token for participant', row.id)
    }

    const authId = authUserIdFromCohortParticipantProfileMap(row.user_id, profMap)
    if (!authId) {
      console.warn('[cohort-study-completion] backfill: no auth id for participant', row.id)
      continue
    }
    const email = await resolveAuthEmail(authId)
    if (!email) {
      console.warn('[cohort-study-completion] backfill: no email for user', authId)
      continue
    }

    const productName =
      (cdef?.product_name != null && String(cdef.product_name).trim() !== ''
        ? String(cdef.product_name).trim()
        : null) || 'your study'

    const storeCreditPartnerReward = cohortUsesStoreCreditPartnerReward(
      (cdef || {}) as { study_landing_reward_config?: unknown; checkin_fields?: unknown },
    )
    const storeCreditTitle = storeCreditTitleFromCohortRow(
      (cdef || {}) as { study_landing_reward_config?: unknown; checkin_fields?: unknown },
    )

    const mail = await sendCohortStudyCompletionEmail({
      to: email,
      authUserId: authId,
      productName,
      partnerBrandName: cdef?.brand_name ?? null,
      cohortSlug: cdef?.slug ?? null,
      rewardClaimAbsoluteUrl,
      storeCreditPartnerReward,
      storeCreditTitle,
    })
    if (!mail.success) {
      errors.push(`${row.id} backfill email: ${mail.error || 'send failed'}`)
      continue
    }

    const { error: flagErr } = await supabaseAdmin
      .from('cohort_participants')
      .update({ completion_email_sent_at: new Date().toISOString() })
      .eq('id', row.id)
      .is('completion_email_sent_at', null)

    if (flagErr) {
      errors.push(`${row.id} backfill flag: ${flagErr.message}`)
    } else {
      sent++
    }
  }

  return { ok: true as const, sent, errors }
}

async function processResultReadyEmails(dry: boolean) {
  let sent = 0
  const errors: string[] = []

  const { data: results, error } = await supabaseAdmin
    .from('cohort_participant_results')
    .select('user_id, cohort_id, status, published_at')
    .eq('status', 'published')
    .not('published_at', 'is', null)

  if (error) {
    console.error('[cohort-study-completion] results load:', error)
    return { ok: false as const, error: error.message, sent: 0, errors }
  }

  for (const r of (results || []) as Array<{
    user_id: string
    cohort_id: string
    status: string
    published_at: string
  }>) {
    const { data: prof } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', r.user_id)
      .maybeSingle()
    const pid = (prof as { id?: string } | null)?.id
    const cand = cohortParticipantUserIdCandidatesSync(pid || '', r.user_id)
    const { data: cp, error: cpErr } = await supabaseAdmin
      .from('cohort_participants')
      .select('id, result_ready_email_sent_at')
      .eq('cohort_id', r.cohort_id)
      .in('user_id', cand)
      .maybeSingle()

    if (cpErr || !cp) continue
    if ((cp as { result_ready_email_sent_at?: string | null }).result_ready_email_sent_at) continue

    if (dry) {
      sent++
      continue
    }

    const email = await resolveAuthEmail(r.user_id)
    if (!email) continue

    const { data: cRow } = await supabaseAdmin
      .from('cohorts')
      .select('slug, product_name, brand_name, study_landing_reward_config, checkin_fields')
      .eq('id', r.cohort_id)
      .maybeSingle()
    const cMeta = cRow as {
      slug?: string | null
      product_name?: string | null
      brand_name?: string | null
      study_landing_reward_config?: unknown
      checkin_fields?: unknown
    } | null
    const productName =
      (cMeta?.product_name != null && String(cMeta.product_name).trim() !== ''
        ? String(cMeta.product_name).trim()
        : null) || 'your study'

    let rewardClaimAbsoluteUrl: string | null = null
    let proRewardAlreadyClaimed = false
    const { data: claimRow } = await supabaseAdmin
      .from('cohort_reward_claims')
      .select('token, claimed_at')
      .eq('cohort_participant_id', (cp as { id: string }).id)
      .maybeSingle()
    const cr = claimRow as { token?: string; claimed_at?: string | null } | null
    if (cr?.claimed_at) {
      proRewardAlreadyClaimed = true
    } else if (cr?.token && String(cr.token).trim() !== '') {
      rewardClaimAbsoluteUrl = `${cohortEmailPublicOrigin()}/claim?token=${encodeURIComponent(String(cr.token).trim())}`
    }

    const storeCreditPartnerReward = cohortUsesStoreCreditPartnerReward(
      (cMeta || {}) as { study_landing_reward_config?: unknown; checkin_fields?: unknown },
    )
    const storeCreditTitle = storeCreditTitleFromCohortRow(
      (cMeta || {}) as { study_landing_reward_config?: unknown; checkin_fields?: unknown },
    )
    const cohortSlug =
      cMeta?.slug != null && String(cMeta.slug).trim() !== '' ? String(cMeta.slug).trim() : null

    const mail = await sendCohortResultReadyEmail({
      to: email,
      authUserId: r.user_id,
      productName,
      partnerBrandName: cMeta?.brand_name ?? null,
      cohortSlug,
      rewardClaimAbsoluteUrl,
      proRewardAlreadyClaimed,
      storeCreditPartnerReward,
      storeCreditTitle,
    })
    if (!mail.success) {
      errors.push(`result ${r.cohort_id}/${r.user_id}: ${mail.error}`)
      continue
    }

    const { error: upErr } = await supabaseAdmin
      .from('cohort_participants')
      .update({ result_ready_email_sent_at: new Date().toISOString() })
      .eq('id', (cp as { id: string }).id)
      .is('result_ready_email_sent_at', null)

    if (upErr) errors.push(`result flag ${(cp as { id: string }).id}: ${upErr.message}`)
    else sent++
  }

  return { ok: true as const, sent, errors }
}

export async function GET(request: NextRequest) {
  const denied = assertCron(request)
  if (denied) return denied
  const dry = new URL(request.url).searchParams.get('dry') === '1'

  try {
    const completion = await processCompletionPass(dry)
    if (!completion.ok) {
      return NextResponse.json({ ok: false, error: completion.error }, { status: 500 })
    }
    const backfill = await processCompletionEmailBackfillPass(dry)
    if (!backfill.ok) {
      return NextResponse.json({ ok: false, error: backfill.error }, { status: 500 })
    }
    const ready = await processResultReadyEmails(dry)
    if (!ready.ok) {
      return NextResponse.json({ ok: false, error: ready.error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      dry,
      completed: completion.completed,
      completionEmails: completion.completionEmails,
      completionEmailBackfillSent: backfill.sent,
      resultReadyEmails: ready.sent,
      errors: [...completion.errors, ...backfill.errors, ...ready.errors],
    })
  } catch (e: unknown) {
    console.error('[cohort-study-completion]', e)
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'failed' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
