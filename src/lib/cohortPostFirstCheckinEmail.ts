import { countDistinctDailyEntriesSinceForUserIds } from '@/lib/cohortCheckinCount'
import { cohortParticipantUserIdCandidatesSync } from '@/lib/cohortParticipantUserId'
import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import { cohortTransactionalCheckinMagicHref } from '@/lib/cohortEmailMagicLink'
import {
  COHORT_EMAIL_CTA_LINK_ATTRS,
  escapeHtml,
  firstNameFromAuthUser,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { studyAndProductNamesFromCohortRow } from '@/lib/cohortComplianceConfirmed'
import {
  cohortUsesStoreCreditPartnerReward,
  storeCreditTitleFromCohortRow,
} from '@/lib/cohortStudyLandingRewards'

export type CohortPostFirstCheckinEmailResult = {
  sent: boolean
  skip?: string
  debug?: Record<string, unknown>
}

export function buildCohortPostFirstCheckinTransactionalEmailHtml(params: {
  firstNameForGreeting: string
  studyName: string
  productName: string
  partnerBrandName: string
  checkInHref: string
  cohortSlug?: string | null
  /** When true, no product-supply reward or “dispatch supply” wording. */
  storeCreditPartnerReward?: boolean
  storeCreditTitle?: string | null
}): { subject: string; html: string } {
  const first = escapeHtml(params.firstNameForGreeting)
  const partnerBrand = escapeHtml(
    String(params.partnerBrandName || 'Study partner').trim() || 'Study partner',
  )
  const partnerBrandPlain = String(params.partnerBrandName || 'Study partner').trim() || 'Study partner'
  const checkInHref = String(params.checkInHref || '').trim()
  const storeCredit = params.storeCreditPartnerReward === true

  const appBase = cohortEmailPublicOrigin()

  const shipmentLi = storeCredit
    ? `<li style="margin:0 0 8px;">You&apos;ll receive study and shipping updates from <strong>${partnerBrand}</strong> by email</li>`
    : `<li style="margin:0 0 8px;">Your product will be shipped</li>`

  const innerHtml =
    `<p style="margin:0 0 16px;">Hi ${first},</p>` +
    `<p style="margin:0 0 16px;">You&apos;ve completed your first check-in.</p>` +
    `<p style="margin:0 0 8px;"><strong>To confirm your place:</strong></p>` +
    `<ul style="margin:0 0 16px;padding-left:20px;">` +
    `<li style="margin:0 0 8px;">Complete one more check-in tomorrow</li>` +
    `</ul>` +
    `<p style="margin:0 0 16px;">Once that&apos;s done, you&apos;ll be fully confirmed.</p>` +
    `<p style="margin:0 0 8px;"><strong>After confirmation:</strong></p>` +
    `<ul style="margin:0 0 20px;padding-left:20px;">` +
    `<li style="margin:0 0 8px;">Check in for 3 more days so we have your baseline before your product arrives</li>` +
    shipmentLi +
    `<li style="margin:0;">Once it arrives, you&apos;ll start the 21-day study</li>` +
    `</ul>` +
    `<p style="margin:28px 0 8px;text-align:center;">` +
    `<a href="${escapeHtml(checkInHref)}"${COHORT_EMAIL_CTA_LINK_ATTRS} style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">Complete your next check-in →</a>` +
    `</p>`

  const html = wrapCohortTransactionalEmailHtml({
    appBase,
    partnerBrandName: partnerBrandPlain,
    cohortSlug: params.cohortSlug,
    innerHtml,
    dashboardHref: checkInHref,
    omitDashboardRow: true,
  })
  return { subject: 'One more check-in to confirm your place', html }
}

/**
 * After first distinct compliance check-in (n === 1): send nudge for second check-in.
 * Claimed atomically via post_first_checkin_email_sent_at to avoid duplicates.
 *
 * Skips when `study_started_at` is set — active study users get daily reminders only, not gate copy.
 * Participant may be `applied` or, in edge cases, `confirmed` with n===1 — still send if claim is free.
 * Call this before tryImmediateCohortComplianceConfirm so a mistaken n>=2 cannot confirm before this runs.
 */
export async function trySendCohortPostFirstCheckinEmail(opts: {
  authUserId: string
  profileId: string
  cohortSlug: string
}): Promise<CohortPostFirstCheckinEmailResult> {
  console.log('[cohort-post-first-checkin-email] called', {
    authUserId: opts.authUserId,
    profileId: opts.profileId,
    cohortSlug: opts.cohortSlug,
  })
  const slug = String(opts.cohortSlug || '').trim()
  if (!slug || !opts.profileId || !opts.authUserId) {
    return {
      sent: false,
      skip: 'missing_slug_profile_or_auth',
      debug: {
        hasSlug: !!slug,
        hasProfileId: !!opts.profileId,
        hasAuthUserId: !!opts.authUserId,
      },
    }
  }

  try {
    const { data: cohort, error: cErr } = await supabaseAdmin
      .from('cohorts')
      .select('id, product_name, brand_name, study_landing_reward_config, checkin_fields')
      .eq('slug', slug)
      .maybeSingle()
    if (cErr || !cohort?.id) {
      return {
        sent: false,
        skip: 'cohort_not_found',
        debug: { slug, err: cErr?.message ?? null },
      }
    }

    const userKeys = cohortParticipantUserIdCandidatesSync(opts.profileId, opts.authUserId)
    const { data: part, error: pErr } = await supabaseAdmin
      .from('cohort_participants')
      .select('id, enrolled_at, status, study_started_at')
      .in('user_id', userKeys)
      .eq('cohort_id', cohort.id)
      .in('status', ['applied', 'confirmed'])
      .maybeSingle()
    if (pErr || !part?.id || !part.enrolled_at) {
      return {
        sent: false,
        skip: 'participant_not_found',
        debug: {
          cohortId: cohort.id,
          userKeys,
          err: pErr?.message ?? null,
          hasRow: !!part,
        },
      }
    }

    if (part.study_started_at != null && String(part.study_started_at).trim() !== '') {
      return {
        sent: false,
        skip: 'study_started_at_set',
        debug: { partId: part.id, study_started_at: part.study_started_at },
      }
    }

    const n = await countDistinctDailyEntriesSinceForUserIds(
      userKeys,
      String(part.enrolled_at),
    )
    if (n !== 1) {
      return {
        sent: false,
        skip: n === 0 ? 'checkin_count_zero' : 'checkin_count_not_1',
        debug: {
          n,
          userKeys,
          participantStatus: (part as { status?: string }).status,
          enrolled_at: part.enrolled_at,
        },
      }
    }

    const { data: claimed, error: claimErr } = await supabaseAdmin
      .from('cohort_participants')
      .update({ post_first_checkin_email_sent_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', part.id)
      .is('post_first_checkin_email_sent_at', null)
      .select('id')
      .maybeSingle()

    if (claimErr || !claimed?.id) {
      return {
        sent: false,
        skip: claimErr ? 'claim_update_error' : 'already_sent_or_race',
        debug: { claimErr: claimErr?.message ?? null, partId: part.id },
      }
    }

    const { data: auth, error: auErr } = await supabaseAdmin.auth.admin.getUserById(opts.authUserId)
    if (auErr || !auth?.user?.email) {
      console.error('[cohort-post-first-checkin-email] no email', opts.authUserId, auErr?.message)
      await supabaseAdmin
        .from('cohort_participants')
        .update({ post_first_checkin_email_sent_at: null } as Record<string, unknown>)
        .eq('id', part.id)
      return {
        sent: false,
        skip: 'no_auth_email',
        debug: { authUserId: opts.authUserId, err: auErr?.message ?? null },
      }
    }
    const to = String(auth.user.email).trim()
    if (!to) {
      await supabaseAdmin
        .from('cohort_participants')
        .update({ post_first_checkin_email_sent_at: null } as Record<string, unknown>)
        .eq('id', part.id)
      return { sent: false, skip: 'empty_email', debug: {} }
    }

    const { studyName, productName } = studyAndProductNamesFromCohortRow(
      cohort as { product_name?: string | null; brand_name?: string | null },
    )
    const partnerBrandPlain = String((cohort as { brand_name?: string | null }).brand_name || 'Study partner').trim() || 'Study partner'
    const { href: checkInHref } = await cohortTransactionalCheckinMagicHref(to, 'post-first-checkin')

    const storeCreditPartnerReward = cohortUsesStoreCreditPartnerReward(
      cohort as { study_landing_reward_config?: unknown; checkin_fields?: unknown },
    )
    const storeCreditTitle = storeCreditTitleFromCohortRow(
      cohort as { study_landing_reward_config?: unknown; checkin_fields?: unknown },
    )

    const { subject, html } = buildCohortPostFirstCheckinTransactionalEmailHtml({
      firstNameForGreeting: firstNameFromAuthUser(auth.user),
      studyName,
      productName,
      partnerBrandName: partnerBrandPlain,
      checkInHref,
      cohortSlug: slug,
      storeCreditPartnerReward,
      storeCreditTitle,
    })

    const r = await sendEmail({
      to,
      subject,
      html,
    })
    if (!r.success) {
      console.error('[cohort-post-first-checkin-email] send failed:', to, r.error)
      await supabaseAdmin
        .from('cohort_participants')
        .update({ post_first_checkin_email_sent_at: null } as Record<string, unknown>)
        .eq('id', part.id)
      return {
        sent: false,
        skip: 'resend_failed',
        debug: { to, error: r.error },
      }
    }

    return { sent: true, debug: { to, partId: part.id } }
  } catch (e) {
    console.error('[cohort-post-first-checkin-email]', e)
    return { sent: false, skip: 'exception', debug: { message: String(e) } }
  }
}
