import { cohortEmailCheckInLandingAbsoluteUrl } from '@/lib/cohortCheckInLanding'
import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import {
  COHORT_EMAIL_BRAND_LINE,
  COHORT_EMAIL_CTA_LINK_ATTRS,
  escapeHtml,
  firstNameFromAuthUser,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { studyAndProductNamesFromCohortRow } from '@/lib/cohortComplianceConfirmed'

/**
 * Immediate enrollment email when a cohort participant joins (profiles POST + cohort, or first cohort attach).
 * Uses shared DoNotAge × BioStackr transactional shell: dual logos, rust CTA, footer (brief item 8).
 */
export async function sendCohortEnrollmentEmail(params: {
  to: string
  authUserId?: string | null
  cohortSlug?: string | null
}): Promise<void> {
  const to = String(params.to || '').trim()
  if (!to) return

  let first = 'there'
  const uid = String(params.authUserId || '').trim()
  if (uid) {
    const { data: auth, error: auErr } = await supabaseAdmin.auth.admin.getUserById(uid)
    if (!auErr && auth?.user) {
      first = firstNameFromAuthUser(auth.user)
    }
  }
  const firstEsc = escapeHtml(first)

  let productLabel = 'SureSleep'
  const slug = String(params.cohortSlug || '').trim()
  if (slug) {
    const { data: row } = await supabaseAdmin.from('cohorts').select('product_name, brand_name').eq('slug', slug).maybeSingle()
    if (row) {
      const { productName } = studyAndProductNamesFromCohortRow(
        row as { product_name?: string | null; brand_name?: string | null },
      )
      if (productName && productName !== 'product') productLabel = productName
    }
  }
  const productEsc = escapeHtml(productLabel)

  const appBase = cohortEmailPublicOrigin()
  const checkinHref = cohortEmailCheckInLandingAbsoluteUrl()

  const subject = "You're in — complete your first check-in"

  const innerHtml =
    `<p style="margin:0 0 16px;">Hi ${firstEsc},</p>` +
    `<p style="margin:0 0 16px;">Welcome to the ${escapeHtml(COHORT_EMAIL_BRAND_LINE)} study.</p>` +
    `<p style="margin:0 0 6px;"><strong>To confirm your place:</strong></p>` +
    `<p style="margin:0 0 16px;line-height:1.55;color:#374151;">` +
    `• Complete your first check-in today<br />` +
    `• Complete your second check-in tomorrow morning` +
    `</p>` +
    `<p style="margin:0 0 16px;">This gives us your baseline.</p>` +
    `<p style="margin:0 0 22px;">Once both check-ins are complete, your place in the study is confirmed and your <strong>${productEsc}</strong> is shipped to you.</p>` +
    `<p style="margin:28px 0 0;text-align:center;">` +
    `<a href="${escapeHtml(checkinHref)}"${COHORT_EMAIL_CTA_LINK_ATTRS} style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">Complete your first check-in →</a>` +
    `</p>`

  const html = wrapCohortTransactionalEmailHtml({
    appBase,
    innerHtml,
    dashboardHref: checkinHref,
    omitDashboardRow: true,
  })

  await sendEmail({ to, subject, html })
}
