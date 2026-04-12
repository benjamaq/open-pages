import { fetchCohortCheckinYmdsSinceEnrollForUserIds } from '@/lib/cohortCheckinCount'
import { cohortParticipantUserIdCandidatesSync } from '@/lib/cohortParticipantUserId'
import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import { cohortTransactionalDashboardMagicHref } from '@/lib/cohortEmailMagicLink'
import {
  cohortEmailDashboardCtaHtml,
  escapeHtml,
  firstNameFromAuthUser,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { studyAndProductNamesFromCohortRow } from '@/lib/cohortStudyProductNames'
import {
  cohortUsesStoreCreditPartnerReward,
  NEUTRAL_STORE_CREDIT_DISPLAY_TITLE,
  storeCreditTitleFromCohortRow,
} from '@/lib/cohortStudyLandingRewards'

export { studyAndProductNamesFromCohortRow } from '@/lib/cohortStudyProductNames'

export function buildComplianceConfirmedTransactionalEmailHtml(params: {
  firstNameForGreeting: string
  studyName: string
  productName: string
  brandName: string
  /** Absolute URL — production uses Supabase magic link via `cohortTransactionalDashboardMagicHref`. */
  dashboardStudyHref: string
  cohortSlug?: string | null
  storeCreditPartnerReward?: boolean
  storeCreditTitle?: string | null
}): { subject: string; html: string } {
  const first = escapeHtml(params.firstNameForGreeting)
  const study = escapeHtml(params.studyName)
  const product = escapeHtml(params.productName)
  const partnerPlain = String(params.brandName || '').trim() || 'Study partner'
  const brand = escapeHtml(partnerPlain)
  const appBase = cohortEmailPublicOrigin()
  const dashboardStudyHref = String(params.dashboardStudyHref || '').trim()
  const storeCredit = params.storeCreditPartnerReward === true
  const creditEsc = escapeHtml(
    String(params.storeCreditTitle || NEUTRAL_STORE_CREDIT_DISPLAY_TITLE).trim() ||
      NEUTRAL_STORE_CREDIT_DISPLAY_TITLE,
  )

  const rewardParagraph = storeCredit
    ? `<p style="margin:0 0 20px;">Your completion rewards — <strong>${creditEsc}</strong> from <strong>${brand}</strong>, plus three months of BioStackr Pro — are locked in from today.</p>`
    : `<p style="margin:0 0 20px;">Your completion reward — a 3-month supply of ${product} from <strong>${brand}</strong>, plus three months of BioStackr Pro — is locked in from today.</p>`

  const innerHtml =
    `<p style="margin:0 0 16px;">Hi ${first},</p>` +
    `<p style="margin:0 0 20px;">You're in. Your place in the <strong>${study}</strong> study is confirmed. <strong>${brand}</strong> will be dispatching your <strong>${product}</strong> shortly — <strong>BioStackr</strong> runs the study platform and your check-ins.</p>` +
    `<p style="margin:0 0 20px;">Your next step: come back tomorrow morning for your next check-in.</p>` +
    `<p style="margin:0 0 6px;"><strong>Before it arrives</strong></p>` +
    `<p style="margin:0 0 18px;">Keep your routine stable — no new supplements. We want a clean baseline.</p>` +
    `<p style="margin:0 0 6px;"><strong>When it arrives</strong></p>` +
    `<p style="margin:0 0 18px;">Use <strong>${product}</strong> exactly as directed for this study&apos;s protocol.<br />Complete your first study check-in the next calendar day after you begin.</p>` +
    `<p style="margin:0 0 6px;"><strong>During the study</strong></p>` +
    `<p style="margin:0 0 18px;">You'll get a short daily reminder from <strong>BioStackr</strong>. Each check-in takes ~30 seconds.</p>` +
    `<p style="margin:0 0 6px;"><strong>At the end</strong></p>` +
    `<p style="margin:0 0 18px;">You'll receive a clear breakdown of what actually changed for you.</p>` +
    rewardParagraph +
    `<p style="margin:0;">Thank you for being part of this.</p>` +
    cohortEmailDashboardCtaHtml(dashboardStudyHref)

  const html = wrapCohortTransactionalEmailHtml({
    appBase,
    partnerBrandName: partnerPlain,
    cohortSlug: params.cohortSlug,
    innerHtml,
    dashboardHref: dashboardStudyHref,
    omitDashboardRow: true,
  })
  const subject = "You're in — your product is on its way"
  return { subject, html }
}

/** Confirmation email after two qualifying check-ins (cron backstop + immediate path from /api/checkin). */
export async function sendComplianceConfirmedEmail(params: {
  authUserId: string
  studyName: string
  productName: string
  brandName?: string | null
  cohortSlug?: string | null
  storeCreditPartnerReward?: boolean
  storeCreditTitle?: string | null
}): Promise<void> {
  try {
    const { data: auth, error: auErr } = await supabaseAdmin.auth.admin.getUserById(params.authUserId)
    if (auErr || !auth?.user?.email) {
      console.error('[cohort-compliance] confirm email: no auth email', params.authUserId, auErr?.message)
      return
    }
    const to = String(auth.user.email).trim()
    if (!to) return

    const dashboardStudyHref = await cohortTransactionalDashboardMagicHref(to, 'compliance-confirmed')
    const { subject, html } = buildComplianceConfirmedTransactionalEmailHtml({
      firstNameForGreeting: firstNameFromAuthUser(auth.user),
      studyName: params.studyName,
      productName: params.productName,
      brandName: params.brandName ?? '',
      dashboardStudyHref,
      cohortSlug: params.cohortSlug,
      storeCreditPartnerReward: params.storeCreditPartnerReward,
      storeCreditTitle: params.storeCreditTitle,
    })

    const r = await sendEmail({
      to,
      subject,
      html,
    })
    if (!r.success) {
      console.error('[cohort-compliance] confirm email send failed:', to, r.error)
    }
  } catch (e) {
    console.error('[cohort-compliance] confirm email exception:', e)
  }
}

function shortId(id: string | undefined): string {
  const s = String(id || '')
  return s.length <= 8 ? s : s.slice(-8)
}

/**
 * After a cohort daily_entries upsert: if this applied participant now has ≥2 distinct check-in days
 * since enroll (same semantics as the cron), confirm and send the same email. Cron remains the backstop
 * for missed edge cases.
 */
export async function tryImmediateCohortComplianceConfirm(opts: {
  authUserId: string
  profileId: string
  cohortSlug: string
}): Promise<void> {
  const slug = String(opts.cohortSlug || '').trim()
  const logCtx = {
    authUserIdSuffix: shortId(opts.authUserId),
    profileIdSuffix: shortId(opts.profileId),
    cohortSlug: slug,
  }
  if (!slug || !opts.profileId || !opts.authUserId) {
    console.log('[cohort-compliance] immediate confirm skip: missing slug/profile/auth', logCtx)
    return
  }

  try {
    const { data: cohort, error: cErr } = await supabaseAdmin
      .from('cohorts')
      .select('id, product_name, brand_name, study_landing_reward_config, checkin_fields')
      .eq('slug', slug)
      .maybeSingle()
    if (cErr || !cohort?.id) {
      console.warn('[cohort-compliance] immediate confirm skip: cohort lookup', { ...logCtx, cErr: cErr?.message })
      return
    }

    const userKeys = cohortParticipantUserIdCandidatesSync(opts.profileId, opts.authUserId)
    const { data: partRows, error: pErr } = await supabaseAdmin
      .from('cohort_participants')
      .select('id, enrolled_at')
      .in('user_id', userKeys)
      .eq('cohort_id', cohort.id)
      .eq('status', 'applied')
      .limit(5)
    if (pErr) {
      console.error('[cohort-compliance] immediate confirm skip: participant query error', { ...logCtx, pErr: pErr.message })
      return
    }
    const rows = (partRows || []) as Array<{ id: string; enrolled_at: string }>
    if (rows.length > 1) {
      console.warn('[cohort-compliance] multiple applied rows for same cohort/user keys; using first', {
        ...logCtx,
        cohortParticipantIds: rows.map((r) => shortId(r.id)),
        count: rows.length,
      })
    }
    const part = rows[0]
    if (!part?.id || !part.enrolled_at) {
      console.log('[cohort-compliance] immediate confirm skip: no applied participant row', {
        ...logCtx,
        cohortId: cohort.id,
        userKeysSuffixes: userKeys.map((k) => shortId(k)),
      })
      return
    }

    const enrolledIso = String(part.enrolled_at)
    const ymds = await fetchCohortCheckinYmdsSinceEnrollForUserIds(userKeys, enrolledIso)
    const n = ymds.length

    const { data: dbgEntries } = await supabaseAdmin
      .from('daily_entries')
      .select('local_date, created_at, user_id')
      .in('user_id', userKeys)
      .order('local_date', { ascending: false })
      .limit(12)

    if (n < 2) {
      console.log('[cohort-compliance] immediate confirm skipped: need 2 distinct days', {
        ...logCtx,
        cohortParticipantId: part.id,
        cohortId: cohort.id,
        distinctDayCount: n,
        distinctLocalDates: [...ymds].sort(),
        enrolled_at: enrolledIso,
        dailyEntriesRecent: (dbgEntries || []).map((r) => ({
          local_date: (r as { local_date?: string }).local_date,
          created_at: (r as { created_at?: string }).created_at,
          user_id_suffix: shortId((r as { user_id?: string }).user_id),
        })),
      })
      return
    }

    const { data: updated, error: uErr } = await supabaseAdmin
      .from('cohort_participants')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      } as any)
      .eq('id', part.id)
      .eq('status', 'applied')
      .select('id')
      .maybeSingle()

    if (uErr) {
      console.error('[cohort-compliance] confirm UPDATE error', { cohortParticipantId: part.id, uErr })
      return
    }
    if (!updated?.id) {
      console.warn('[cohort-compliance] confirm UPDATE returned 0 rows (race or status not applied)', {
        cohortParticipantId: part.id,
        ...logCtx,
      })
      return
    }

    console.log('[cohort-compliance] immediate confirm OK', {
      cohortParticipantId: part.id,
      distinctDayCount: n,
      ...logCtx,
    })

    const { studyName, productName } = studyAndProductNamesFromCohortRow(
      cohort as { product_name?: string | null; brand_name?: string | null },
    )
    const brandName = (cohort as { brand_name?: string | null }).brand_name
    const storeCreditPartnerReward = cohortUsesStoreCreditPartnerReward(
      cohort as { study_landing_reward_config?: unknown; checkin_fields?: unknown },
    )
    const storeCreditTitle = storeCreditTitleFromCohortRow(
      cohort as { study_landing_reward_config?: unknown },
    )
    await sendComplianceConfirmedEmail({
      authUserId: opts.authUserId,
      studyName,
      productName,
      brandName,
      cohortSlug: slug,
      storeCreditPartnerReward,
      storeCreditTitle,
    })
  } catch (e) {
    console.error('[checkin] cohort compliance confirm', e)
  }
}
