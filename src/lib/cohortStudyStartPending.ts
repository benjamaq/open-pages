import { supabaseAdmin } from '@/lib/supabase/admin'
import { cohortParticipantUserIdCandidatesSync } from '@/lib/cohortParticipantUserId'
import { sendCohortStudyStartEmail } from '@/lib/cohortStudyStartEmail'
import {
  cohortUsesStoreCreditPartnerReward,
  storeCreditTitleFromCohortRow,
} from '@/lib/cohortStudyLandingRewards'

export const STUDY_START_PENDING_SCHEMA_V = 1 as const

export type StudyStartPendingV1 = {
  v: typeof STUDY_START_PENDING_SCHEMA_V
  studyStartedIso: string
  productArrivedAtYmd: string | null
  sendStudyStartEmail: boolean
}

export function parseStudyStartPending(raw: unknown): StudyStartPendingV1 | null {
  if (raw == null || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.v !== STUDY_START_PENDING_SCHEMA_V) return null
  const studyStartedIso =
    typeof o.studyStartedIso === 'string' ? o.studyStartedIso.trim() : ''
  if (!studyStartedIso) return null
  let productArrivedAtYmd: string | null = null
  if ('productArrivedAtYmd' in o) {
    const pr = o.productArrivedAtYmd
    if (pr === null) {
      productArrivedAtYmd = null
    } else if (typeof pr === 'string') {
      const y = pr.trim().slice(0, 10)
      productArrivedAtYmd = /^\d{4}-\d{2}-\d{2}$/.test(y) ? y : null
    } else {
      return null
    }
  }
  const sendStudyStartEmail = o.sendStudyStartEmail === true
  return {
    v: STUDY_START_PENDING_SCHEMA_V,
    studyStartedIso,
    productArrivedAtYmd,
    sendStudyStartEmail,
  }
}

/**
 * After a successful cohort `daily_entries` upsert: promote pending study clock + optional * product_arrived_at, then send study-start email if the arrival flow requested it.
 */
export async function applyCohortStudyStartPendingAfterCohortCheckin(params: {
  authUserId: string
  authEmail: string | null | undefined
  cohortSlug: string
}): Promise<void> {
  const authUserId = String(params.authUserId || '').trim()
  const cohortSlug = String(params.cohortSlug || '').trim()
  if (!authUserId || !cohortSlug) return

  try {
    const { data: cdef, error: cErr } = await supabaseAdmin
      .from('cohorts')
      .select(
        'id, product_name, brand_name, study_days, study_landing_reward_config, checkin_fields',
      )
      .eq('slug', cohortSlug)
      .maybeSingle()
    if (cErr || !cdef?.id) return
    const cohortUuid = String((cdef as { id: string }).id)

    const { data: prof } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle()
    const profileId = (prof as { id?: string } | null)?.id
      ? String((prof as { id: string }).id)
      : ''
    const cpUserIds = cohortParticipantUserIdCandidatesSync(profileId, authUserId)

    const { data: part, error: pErr } = await supabaseAdmin
      .from('cohort_participants')
      .select('id, study_started_at, study_start_pending')
      .in('user_id', cpUserIds)
      .eq('cohort_id', cohortUuid)
      .maybeSingle()
    if (pErr || !part?.id) return

    const startedRaw = (part as { study_started_at?: string | null }).study_started_at
    if (startedRaw != null && String(startedRaw).trim() !== '') return

    const parsed = parseStudyStartPending(
      (part as { study_start_pending?: unknown }).study_start_pending,
    )
    if (!parsed) return

    const patch: Record<string, unknown> = {
      study_started_at: parsed.studyStartedIso,
      study_start_pending: null,
    }
    if (parsed.productArrivedAtYmd != null) {
      patch.product_arrived_at = parsed.productArrivedAtYmd
    }

    const { error: upErr } = await supabaseAdmin
      .from('cohort_participants')
      .update(patch)
      .eq('id', (part as { id: string }).id)
      .is('study_started_at', null)

    if (upErr) {
      console.error('[applyCohortStudyStartPendingAfterCohortCheckin] update', upErr)
      return
    }

    if (!parsed.sendStudyStartEmail) return

    const email = String(params.authEmail || '').trim()
    if (!email) return

    const productName =
      (cdef as { product_name?: string | null }).product_name != null
        ? String((cdef as { product_name: string }).product_name).trim()
        : 'Study product'
    const partnerBrandName = String(
      (cdef as { brand_name?: string | null }).brand_name ?? '',
    ).trim()
    const studyDaysRaw = (cdef as { study_days?: number | null }).study_days
    const studyDurationDays =
      typeof studyDaysRaw === 'number' && Number.isFinite(studyDaysRaw) && studyDaysRaw > 0
        ? Math.floor(studyDaysRaw)
        : 21
    const storeCreditPartnerReward = cohortUsesStoreCreditPartnerReward(
      cdef as { study_landing_reward_config?: unknown; checkin_fields?: unknown },
    )
    const storeCreditTitle = storeCreditTitleFromCohortRow(
      cdef as { study_landing_reward_config?: unknown; checkin_fields?: unknown },
    )

    const r = await sendCohortStudyStartEmail({
      to: email,
      authUserId,
      productName,
      partnerBrandName: partnerBrandName || null,
      cohortSlug,
      studyDurationDays,
      storeCreditPartnerReward,
      storeCreditTitle: storeCreditTitle ?? undefined,
    })
    if (!r.success) {
      console.warn('[applyCohortStudyStartPendingAfterCohortCheckin] email', r.error)
    }
  } catch (e) {
    console.error('[applyCohortStudyStartPendingAfterCohortCheckin]', e)
  }
}
