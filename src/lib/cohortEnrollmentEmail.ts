import { cohortEmailCheckInLandingAbsoluteUrl } from '@/lib/cohortCheckInLanding'
import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import {
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

  let studyLabel = 'DoNotAge SureSleep'
  let productLabel = 'SureSleep'
  let partnerBrand = 'DoNotAge'
  const slug = String(params.cohortSlug || '').trim()
  if (slug) {
    const { data: row } = await supabaseAdmin.from('cohorts').select('product_name, brand_name').eq('slug', slug).maybeSingle()
    if (row) {
      const { studyName, productName } = studyAndProductNamesFromCohortRow(
        row as { product_name?: string | null; brand_name?: string | null },
      )
      if (studyName && studyName !== 'study') studyLabel = studyName
      if (productName && productName !== 'product') productLabel = productName
      const bn = String((row as { brand_name?: string | null }).brand_name || '').trim()
      if (bn) partnerBrand = bn
    }
  }
  const studyEsc = escapeHtml(studyLabel)
  const productEsc = escapeHtml(productLabel)
  const partnerEsc = escapeHtml(partnerBrand)

  const appBase = cohortEmailPublicOrigin()
  const checkinHref = cohortEmailCheckInLandingAbsoluteUrl()

  const subject = "You're in — complete your first check-in"

  const innerHtml =
    `<p style="margin:0 0 16px;">Hi ${firstEsc},</p>` +
    `<p style="margin:0 0 16px;">Welcome to the <strong>${studyEsc}</strong> study. <strong>${partnerEsc}</strong> is your product partner; <strong>BioStackr</strong> runs this study and your check-ins — great to have you in.</p>` +
    `<p style="margin:0 0 16px;">Your first step is to complete two check-ins on consecutive mornings in <strong>BioStackr</strong>. This confirms your place with <strong>${partnerEsc}</strong> and captures your baseline before <strong>${productEsc}</strong> arrives.</p>` +
    `<p style="margin:0 0 10px;"><strong>Check-in 1 — complete today.</strong> This is your baseline — how you sleep before ${productEsc} arrives.</p>` +
    `<p style="margin:0 0 10px;"><strong>Check-in 2 — complete tomorrow morning.</strong> Once done, your spot is confirmed and your product ships.</p>` +
    `<p style="margin:0 0 16px;">Both check-ins need to be done within 48 hours. Anyone who doesn&apos;t complete both is quietly removed — we only ship to people who&apos;ve already shown they&apos;ll follow through.</p>` +
    `<p style="margin:0 0 22px;">Takes about 30 seconds.</p>` +
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
