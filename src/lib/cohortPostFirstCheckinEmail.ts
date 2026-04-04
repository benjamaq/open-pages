import { countDistinctDailyEntriesSinceForUserIds } from '@/lib/cohortCheckinCount'
import { cohortParticipantUserIdCandidatesSync } from '@/lib/cohortParticipantUserId'
import { cohortEmailCheckInLandingAbsoluteUrl } from '@/lib/cohortCheckInLanding'
import {
  COHORT_EMAIL_CTA_LINK_ATTRS,
  escapeHtml,
  firstNameFromAuthUser,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'
import { supabaseAdmin } from '@/lib/supabase/admin'

export type CohortPostFirstCheckinEmailResult = {
  sent: boolean
  skip?: string
  debug?: Record<string, unknown>
}

/**
 * After first distinct compliance check-in (n === 1): send nudge for second check-in.
 * Claimed atomically via post_first_checkin_email_sent_at to avoid duplicates.
 *
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
      .select('id, product_name')
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
      .select('id, enrolled_at, status')
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

    const first = escapeHtml(firstNameFromAuthUser(auth.user))
    const appBase = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.biostackr.com').replace(/\/$/, '')
    const productLabel = escapeHtml(
      String((cohort as { product_name?: string | null }).product_name || 'SureSleep').trim() || 'SureSleep',
    )

    const checkInHref = cohortEmailCheckInLandingAbsoluteUrl()

    const innerHtml =
      `<p style="margin:0 0 16px;">Hi ${first},</p>` +
      `<p style="margin:0 0 16px;">You've completed your first check-in — you're one step away from securing your place.</p>` +
      `<p style="margin:0 0 12px;">Complete your second check-in tomorrow and you'll be fully confirmed. From there:</p>` +
      `<ul style="margin:0 0 20px;padding-left:20px;">` +
      `<li style="margin:0 0 8px;">Your ${productLabel} supply will be dispatched</li>` +
      `<li style="margin:0 0 8px;">Your 21-day tracking begins</li>` +
      `<li style="margin:0 0 8px;">You'll receive your personal results at the end</li>` +
      `<li style="margin:0;">Your completion reward is locked in — a 3-month supply of ${productLabel} plus three months of BioStackr Pro</li>` +
      `</ul>` +
      `<p style="margin:28px 0 0;text-align:center;">` +
      `<a href="${escapeHtml(checkInHref)}"${COHORT_EMAIL_CTA_LINK_ATTRS} style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">Complete your next check-in →</a>` +
      `</p>` +
      `<p style="margin:18px 0 0;text-align:center;">` +
      `<a href="${escapeHtml(checkInHref)}"${COHORT_EMAIL_CTA_LINK_ATTRS} style="display:inline-block;background:#ffffff;color:#6A3F2B !important;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;border:2px solid #C84B2F;">Continue to your check-in →</a>` +
      `</p>`

    const html = wrapCohortTransactionalEmailHtml({
      appBase,
      innerHtml,
      dashboardHref: checkInHref,
      omitDashboardRow: true,
    })

    const r = await sendEmail({
      to,
      subject: 'One more check-in to confirm your place',
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
