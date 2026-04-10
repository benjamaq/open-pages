import { NextRequest, NextResponse } from 'next/server'
import {
  sendComplianceConfirmedEmail,
  studyAndProductNamesFromCohortRow,
} from '@/lib/cohortComplianceConfirmed'
import { cohortUsesStoreCreditPartnerReward, storeCreditTitleFromCohortRow } from '@/lib/cohortStudyLandingRewards'
import { fetchCohortCheckinYmdsSinceEnrollForUserIds } from '@/lib/cohortCheckinCount'
import {
  cohortParticipantUserIdCandidatesSync,
  fetchProfilesByCohortParticipantUserIds,
} from '@/lib/cohortParticipantUserId'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

type ParticipantRow = {
  id: string
  enrolled_at: string
  user_id: string
  cohort_id: string
}

export async function GET(request: NextRequest) {
  const denied = assertCron(request)
  if (denied) return denied

  const dry = new URL(request.url).searchParams.get('dry') === '1'

  try {
    const { data: participants, error: pErr } = await supabaseAdmin
      .from('cohort_participants')
      .select('id, enrolled_at, user_id, cohort_id')
      .eq('status', 'applied')

    if (pErr) {
      console.error('[cohort-compliance] load participants:', pErr)
      return NextResponse.json({ error: pErr.message }, { status: 500 })
    }

    const list = (participants || []) as ParticipantRow[]
    if (list.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, confirmed: 0, dropped: 0, dry })
    }

    console.log('[cohort-compliance] start', {
      appliedCount: list.length,
      dry,
      participantIds: list.map((x) => x.id),
    })

    const profMap = await fetchProfilesByCohortParticipantUserIds(list.map((p) => p.user_id))

    let confirmed = 0
    let dropped = 0
    const now = Date.now()

    for (const p of list) {
      const row = profMap.get(p.user_id)
      if (!row) {
        console.warn('[cohort-compliance] skip: no profile for cohort_participants.user_id', {
          cohortParticipantId: p.id,
          cohortParticipantsUserId: p.user_id,
        })
        continue
      }
      const entryUserIds = cohortParticipantUserIdCandidatesSync(row.id, row.user_id)
      const authUid = row.user_id

      const enrolledIso = String(p.enrolled_at ?? '').trim()
      if (!enrolledIso || enrolledIso === 'null') {
        console.warn('[cohort-compliance] skip: missing enrolled_at', { cohortParticipantId: p.id })
        continue
      }
      const enrollYmd = enrolledIso.slice(0, 10)
      const ymds = await fetchCohortCheckinYmdsSinceEnrollForUserIds(entryUserIds, enrolledIso)
      const n = ymds.length
      const enrolledMs = new Date(enrolledIso).getTime()
      const past48h = Number.isFinite(enrolledMs) && now - enrolledMs > 48 * 60 * 60 * 1000

      console.log('[cohort-compliance] participant', {
        cohortParticipantId: p.id,
        cohortId: p.cohort_id,
        cohortParticipantsUserId: p.user_id,
        profileId: row.id,
        profileAuthUserId: row.user_id,
        entryUserIdsForDailyEntries: entryUserIds,
        enrolledAt: enrolledIso,
        enrollYmdUsedForLocalDateFilter: enrollYmd,
        distinctCheckinDaysSinceEnroll: n,
        checkinYmds: ymds.sort(),
        past48hSinceEnrolledAt: past48h,
        dry,
        branch:
          n >= 2 ? 'confirm_candidate' : past48h ? 'drop_candidate' : 'no_action_wait_window',
      })

      if (n >= 2) {
        if (!dry) {
          const { data: confirmedRow, error: uErr } = await supabaseAdmin
            .from('cohort_participants')
            .update({
              status: 'confirmed',
              confirmed_at: new Date().toISOString(),
            } as any)
            .eq('id', p.id)
            .eq('status', 'applied')
            .select('id')
            .maybeSingle()
          if (uErr) {
            console.error('[cohort-compliance] confirm UPDATE failed', { cohortParticipantId: p.id, uErr })
          } else if (!confirmedRow) {
            console.warn(
              '[cohort-compliance] confirm UPDATE returned 0 rows (not applied or race — check status / RLS)',
              { cohortParticipantId: p.id },
            )
          } else {
            console.log('[cohort-compliance] confirmed', { cohortParticipantId: p.id })
            confirmed += 1
            let studyName = 'study'
            let productName = 'product'
            let brandName: string | null = null
            let storeCreditPartnerReward = false
            let storeCreditTitle: string | null = null
            let cohortSlug: string | null = null
            try {
              const { data: cRow } = await supabaseAdmin
                .from('cohorts')
                .select('slug, product_name, brand_name, study_landing_reward_config, checkin_fields')
                .eq('id', p.cohort_id)
                .maybeSingle()
              const names = studyAndProductNamesFromCohortRow(cRow as { product_name?: string | null; brand_name?: string | null } | null)
              studyName = names.studyName
              productName = names.productName
              brandName = (cRow as { brand_name?: string | null } | null)?.brand_name ?? null
              const rawSlug = (cRow as { slug?: string | null } | null)?.slug
              cohortSlug =
                rawSlug != null && String(rawSlug).trim() !== '' ? String(rawSlug).trim() : null
              storeCreditPartnerReward = cohortUsesStoreCreditPartnerReward(
                (cRow || {}) as { study_landing_reward_config?: unknown; checkin_fields?: unknown },
              )
              storeCreditTitle = storeCreditTitleFromCohortRow(
                (cRow || {}) as { study_landing_reward_config?: unknown; checkin_fields?: unknown },
              )
            } catch (cohErr) {
              console.error('[cohort-compliance] cohort lookup for email', p.cohort_id, cohErr)
            }
            await sendComplianceConfirmedEmail({
              authUserId: authUid,
              studyName,
              productName,
              brandName,
              cohortSlug,
              storeCreditPartnerReward,
              storeCreditTitle,
            })
          }
        } else {
          confirmed += 1
        }
      } else if (n < 2 && past48h) {
        if (!dry) {
          const { data: dropRows, error: uErr } = await supabaseAdmin
            .from('cohort_participants')
            .update({
              status: 'dropped',
              dropped_at: new Date().toISOString(),
            } as any)
            .eq('id', p.id)
            .eq('status', 'applied')
            .select('id')
          if (uErr) {
            console.error('[cohort-compliance] drop UPDATE failed', { cohortParticipantId: p.id, uErr })
          } else {
            const droppedN = (dropRows as { id?: string }[] | null)?.length ?? 0
            if (droppedN === 0) {
              console.warn('[cohort-compliance] drop UPDATE returned 0 rows', { cohortParticipantId: p.id })
            } else {
              console.log('[cohort-compliance] dropped', { cohortParticipantId: p.id })
            }
            dropped += droppedN > 0 ? 1 : 0
          }
        } else {
          dropped += 1
        }
      }
    }

    return NextResponse.json({
      ok: true,
      processed: list.length,
      confirmed,
      dropped,
      dry,
    })
  } catch (e: any) {
    console.error('[cohort-compliance]', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
