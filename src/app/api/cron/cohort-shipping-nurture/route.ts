import { NextRequest, NextResponse } from 'next/server'
import { daysBetweenInclusiveUtcYmd } from '@/lib/cohortCheckinCount'
import { studyAndProductNamesFromCohortRow } from '@/lib/cohortComplianceConfirmed'
import { isSleepShapedCheckinFields, normalizeCohortCheckinFields } from '@/lib/cohortCheckinFields'
import { sendShippingNurtureEmail, type ShippingNurtureStep } from '@/lib/cohortShippingNurture'
import { authUserIdFromCohortParticipantProfileMap, fetchProfilesByCohortParticipantUserIds } from '@/lib/cohortParticipantUserId'
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
  confirmed_at: string
  user_id: string
  cohort_id: string
  study_started_at?: string | null
}

function studyDayNumberFromConfirmed(confirmedIso: string, todayYmd: string): number | null {
  const confirmYmd = String(confirmedIso || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(confirmYmd) || !/^\d{4}-\d{2}-\d{2}$/.test(todayYmd)) {
    return null
  }
  return daysBetweenInclusiveUtcYmd(confirmYmd, todayYmd) + 1
}

function stepForStudyDay(day: number): ShippingNurtureStep | null {
  if (day === 4) return 'day4'
  if (day === 7) return 'day7'
  if (day === 10) return 'day10'
  return null
}

export async function GET(request: NextRequest) {
  const denied = assertCron(request)
  if (denied) return denied

  const dry = new URL(request.url).searchParams.get('dry') === '1'
  const todayYmd = new Date().toISOString().slice(0, 10)

  try {
    const { data: participants, error: pErr } = await supabaseAdmin
      .from('cohort_participants')
      .select('id, confirmed_at, user_id, cohort_id, study_started_at')
      .eq('status', 'confirmed')
      .not('confirmed_at', 'is', null)
      .is('study_started_at', null)

    if (pErr) {
      console.error('[cohort-shipping-nurture] load participants:', pErr)
      return NextResponse.json({ error: pErr.message }, { status: 500 })
    }

    const list = (participants || []) as ParticipantRow[]
    if (list.length === 0) {
      return NextResponse.json({
        ok: true,
        processed: 0,
        sent: 0,
        ...(dry ? { would_send: 0 } : {}),
        skipped: 0,
        dry,
      })
    }

    const partIds = list.map((p) => p.id)
    const { data: sentRows, error: sErr } = await supabaseAdmin
      .from('cohort_shipping_nurture_sent')
      .select('cohort_participant_id, step')
      .in('cohort_participant_id', partIds)

    if (sErr) {
      console.error('[cohort-shipping-nurture] load sent:', sErr)
      return NextResponse.json({ error: sErr.message }, { status: 500 })
    }

    const sentKey = (participantId: string, step: string) => `${participantId}:${step}`
    const already = new Set((sentRows || []).map((r: { cohort_participant_id: string; step: string }) => sentKey(r.cohort_participant_id, r.step)))

    const cohortIds = [...new Set(list.map((p) => p.cohort_id))]
    const cohortById: Record<
      string,
      {
        slug?: string | null
        product_name?: string | null
        brand_name?: string | null
        checkin_fields?: unknown
      }
    > = {}
    if (cohortIds.length > 0) {
      const { data: cohortRows, error: cErr } = await supabaseAdmin
        .from('cohorts')
        .select('id, slug, product_name, brand_name, checkin_fields')
        .in('id', cohortIds)
      if (cErr) {
        console.error('[cohort-shipping-nurture] cohorts:', cErr)
        return NextResponse.json({ error: cErr.message }, { status: 500 })
      }
      for (const row of cohortRows || []) {
        const r = row as { id: string; product_name?: string | null; brand_name?: string | null }
        cohortById[r.id] = r
      }
    }

    const profMap = await fetchProfilesByCohortParticipantUserIds(list.map((p) => p.user_id))

    /** Successful real sends only (always 0 when `dry`). */
    let sent = 0
    /** Dry-run: participants that would receive a nurture email this pass (no send, no DB log). */
    let wouldSend = 0
    let skipped = 0
    const errors: string[] = []

    for (const p of list) {
      const day = studyDayNumberFromConfirmed(p.confirmed_at, todayYmd)
      if (day == null) {
        skipped += 1
        continue
      }
      const step = stepForStudyDay(day)
      if (!step) {
        skipped += 1
        continue
      }
      if (already.has(sentKey(p.id, step))) {
        skipped += 1
        continue
      }

      const authUid = authUserIdFromCohortParticipantProfileMap(p.user_id, profMap)
      if (!authUid) {
        console.warn('[cohort-shipping-nurture] no auth user for profile', p.user_id)
        skipped += 1
        continue
      }

      const cohortRow = cohortById[p.cohort_id]
      const { studyName, productName } = studyAndProductNamesFromCohortRow(cohortRow || null)
      const brandName =
        cohortRow?.brand_name != null && String(cohortRow.brand_name).trim() !== ''
          ? String(cohortRow.brand_name).trim()
          : 'Study partner'
      const sleepShapedCohort = isSleepShapedCheckinFields(
        normalizeCohortCheckinFields(cohortRow?.checkin_fields),
      )

      const { data: auth, error: auErr } = await supabaseAdmin.auth.admin.getUserById(authUid)
      if (auErr || !auth?.user?.email) {
        console.error('[cohort-shipping-nurture] no email', authUid, auErr?.message)
        errors.push(`${p.id}:no-email`)
        skipped += 1
        continue
      }
      const to = String(auth.user.email).trim()
      if (!to) {
        skipped += 1
        continue
      }

      if (dry) {
        wouldSend += 1
        continue
      }

      const slugRaw = cohortRow?.slug
      const cohortSlug =
        slugRaw != null && String(slugRaw).trim() !== '' ? String(slugRaw).trim() : null

      const result = await sendShippingNurtureEmail({
        to,
        step,
        studyName,
        brandName,
        productName,
        sleepShapedCohort,
        cohortSlug,
      })

      if (!result.success) {
        console.error('[cohort-shipping-nurture] send failed', p.id, step, result.error)
        errors.push(`${p.id}:${step}:${result.error || 'send failed'}`)
        continue
      }

      const { error: insErr } = await supabaseAdmin.from('cohort_shipping_nurture_sent').insert({
        cohort_participant_id: p.id,
        step,
        sent_at: new Date().toISOString(),
      } as Record<string, unknown>)

      if (insErr) {
        console.error('[cohort-shipping-nurture] log insert', p.id, step, insErr)
        errors.push(`${p.id}:${step}:log`)
        continue
      }

      sent += 1
    }

    return NextResponse.json({
      ok: true,
      processed: list.length,
      sent,
      ...(dry ? { would_send: wouldSend } : {}),
      skipped,
      error_count: errors.length,
      errors: errors.slice(0, 20),
      dry,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed'
    console.error('[cohort-shipping-nurture]', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
