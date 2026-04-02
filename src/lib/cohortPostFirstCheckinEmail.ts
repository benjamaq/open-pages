import { countDistinctDailyEntriesSinceForUserIds } from '@/lib/cohortCheckinCount'
import { cohortParticipantUserIdCandidatesSync } from '@/lib/cohortParticipantUserId'
import {
  resolveCohortDashboardCheckinEmailHref,
  resolveCohortDashboardEmailHref,
} from '@/lib/cohortEmailMagicLink'
import {
  COHORT_EMAIL_MAGIC_LINK_HINT,
  escapeHtml,
  firstNameFromAuthUser,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * After first distinct compliance check-in (n === 1): send nudge for second check-in.
 * Claimed atomically via post_first_checkin_email_sent_at to avoid duplicates.
 */
export async function trySendCohortPostFirstCheckinEmail(opts: {
  authUserId: string
  profileId: string
  cohortSlug: string
}): Promise<void> {
  const slug = String(opts.cohortSlug || '').trim()
  if (!slug || !opts.profileId || !opts.authUserId) return

  try {
    const { data: cohort, error: cErr } = await supabaseAdmin
      .from('cohorts')
      .select('id, product_name')
      .eq('slug', slug)
      .maybeSingle()
    if (cErr || !cohort?.id) return

    const userKeys = cohortParticipantUserIdCandidatesSync(opts.profileId, opts.authUserId)
    const { data: part, error: pErr } = await supabaseAdmin
      .from('cohort_participants')
      .select('id, enrolled_at')
      .in('user_id', userKeys)
      .eq('cohort_id', cohort.id)
      .eq('status', 'applied')
      .maybeSingle()
    if (pErr || !part?.id || !part.enrolled_at) return

    const n = await countDistinctDailyEntriesSinceForUserIds(userKeys, String(part.enrolled_at))
    if (n !== 1) return

    const { data: claimed, error: claimErr } = await supabaseAdmin
      .from('cohort_participants')
      .update({ post_first_checkin_email_sent_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', part.id)
      .is('post_first_checkin_email_sent_at', null)
      .select('id')
      .maybeSingle()

    if (claimErr || !claimed?.id) return

    const { data: auth, error: auErr } = await supabaseAdmin.auth.admin.getUserById(opts.authUserId)
    if (auErr || !auth?.user?.email) {
      console.error('[cohort-post-first-checkin-email] no email', opts.authUserId, auErr?.message)
      return
    }
    const to = String(auth.user.email).trim()
    if (!to) return

    const first = escapeHtml(firstNameFromAuthUser(auth.user))
    const appBase = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.biostackr.com').replace(/\/$/, '')
    const productLabel = escapeHtml(
      String((cohort as { product_name?: string | null }).product_name || 'SureSleep').trim() || 'SureSleep',
    )

    const dashboardHref = await resolveCohortDashboardEmailHref(to)
    const checkinHref = await resolveCohortDashboardCheckinEmailHref(to)

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
      `<a href="${escapeHtml(checkinHref)}" style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">Complete your next check-in →</a>` +
      `</p>` +
      `<p style="margin:14px 0 0;text-align:center;">` +
      `<a href="${escapeHtml(dashboardHref)}" style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">Go to your dashboard →</a>` +
      `</p>` +
      `<p style="margin:12px 0 0;text-align:center;font-size:12px;line-height:1.45;color:#6b7280;">` +
      escapeHtml(COHORT_EMAIL_MAGIC_LINK_HINT) +
      `</p>`

    const html = wrapCohortTransactionalEmailHtml({
      appBase,
      innerHtml,
      dashboardHref,
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
    }
  } catch (e) {
    console.error('[cohort-post-first-checkin-email]', e)
  }
}
