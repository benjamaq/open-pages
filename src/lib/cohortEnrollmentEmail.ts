import { resolveCohortDashboardCheckinEmailHref } from '@/lib/cohortEmailMagicLink'
import {
  COHORT_EMAIL_MAGIC_LINK_HINT,
  escapeHtml,
  firstNameFromAuthUser,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { studyAndProductNamesFromCohortRow } from '@/lib/cohortComplianceConfirmed'

/**
 * Immediate enrollment email when a cohort participant creates their account (profiles POST + cohort).
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
  const slug = String(params.cohortSlug || '').trim()
  if (slug) {
    const { data: row } = await supabaseAdmin.from('cohorts').select('product_name, brand_name').eq('slug', slug).maybeSingle()
    if (row) {
      const { studyName, productName } = studyAndProductNamesFromCohortRow(
        row as { product_name?: string | null; brand_name?: string | null },
      )
      if (studyName && studyName !== 'study') studyLabel = studyName
      if (productName && productName !== 'product') productLabel = productName
    }
  }
  const studyEsc = escapeHtml(studyLabel)
  const productEsc = escapeHtml(productLabel)

  const appBase = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.biostackr.com').replace(/\/$/, '')
  const checkinHref = await resolveCohortDashboardCheckinEmailHref(to)

  const subject = "You're in — complete your first check-in"

  const innerHtml =
    `<p style="margin:0 0 16px;">Hi ${firstEsc},</p>` +
    `<p style="margin:0 0 16px;">Welcome to the <strong>${studyEsc}</strong> study — great to have you in.</p>` +
    `<p style="margin:0 0 16px;">Your first step is to complete two check-ins on consecutive mornings. This confirms your place and captures your baseline before the product arrives.</p>` +
    `<p style="margin:0 0 10px;"><strong>Check-in 1 — complete today.</strong> This is your baseline — how you sleep before ${productEsc} arrives.</p>` +
    `<p style="margin:0 0 10px;"><strong>Check-in 2 — complete tomorrow morning.</strong> Once done, your spot is confirmed and your product ships.</p>` +
    `<p style="margin:0 0 16px;">Both check-ins need to be done within 48 hours. Anyone who doesn&apos;t complete both is quietly removed — we only ship to people who&apos;ve already shown they&apos;ll follow through.</p>` +
    `<p style="margin:0 0 22px;">It takes about 30 seconds.</p>` +
    `<p style="margin:28px 0 0;text-align:center;">` +
    `<a href="${escapeHtml(checkinHref)}" style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">Complete your first check-in →</a>` +
    `</p>` +
    `<p style="margin:12px 0 0;text-align:center;font-size:12px;line-height:1.45;color:#6b7280;">` +
    escapeHtml(COHORT_EMAIL_MAGIC_LINK_HINT) +
    `</p>`

  const html = wrapCohortTransactionalEmailHtml({
    appBase,
    innerHtml,
    dashboardHref: checkinHref,
    omitDashboardRow: true,
  })

  await sendEmail({ to, subject, html })
}
