import { cohortDashboardStudyPath } from '@/lib/cohortDashboardDeepLink'
import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import {
  COHORT_EMAIL_CTA_LINK_ATTRS,
  escapeHtml,
  firstNameFromAuthUser,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'
import { supabaseAdmin } from '@/lib/supabase/admin'

export function buildCohortStudyStartTransactionalEmailHtml(params: {
  firstNameForGreeting: string
  productName: string
  partnerBrandName: string
  studyDurationDays?: number
}): { subject: string; html: string } {
  const product = String(params.productName || 'your study product').trim() || 'your study product'
  const productEsc = escapeHtml(product)
  const partnerBrand = escapeHtml(String(params.partnerBrandName ?? 'Study partner').trim() || 'Study partner')
  const partnerPlain = String(params.partnerBrandName ?? 'Study partner').trim() || 'Study partner'
  const days =
    typeof params.studyDurationDays === 'number' && Number.isFinite(params.studyDurationDays) && params.studyDurationDays > 0
      ? Math.floor(params.studyDurationDays)
      : 21
  const first = escapeHtml(params.firstNameForGreeting)

  const subject = `Your ${product} study starts today`

  const appBase = cohortEmailPublicOrigin()
  const dashboardHref = `${appBase}${cohortDashboardStudyPath()}`

  const innerHtml =
    `<p style="margin:0 0 16px;">Hi ${first},</p>` +
    `<p style="margin:0 0 16px;">Your <strong>${productEsc}</strong> study starts today. <strong>${partnerBrand}</strong> is your product partner; <strong>BioStackr</strong> runs the study platform and your daily check-ins.</p>` +
    `<p style="margin:0 0 6px;"><strong>Using your product</strong></p>` +
    `<p style="margin:0 0 16px;">Follow the directions on your product label (or your clinician&apos;s guidance) for the full <strong>${days}</strong>-day study window unless you&apos;re unwell.</p>` +
    `<p style="margin:0 0 6px;"><strong>Daily check-ins</strong></p>` +
    `<p style="margin:0 0 16px;">Each day, <strong>BioStackr</strong> will remind you to complete a short check-in based on your study&apos;s questions — usually well under a minute.</p>` +
    `<p style="margin:0 0 6px;"><strong>If life gets in the way</strong></p>` +
    `<p style="margin:0 0 16px;">Some days won&apos;t be typical — travel, illness, unusual stress. Complete your check-in as usual and use any tags your dashboard offers so we can exclude those days from analysis when appropriate.</p>` +
    `<p style="margin:0 0 6px;"><strong>If you&apos;re unwell</strong></p>` +
    `<p style="margin:0 0 16px;">Pause the product until you feel better unless your clinician says otherwise. Tag those days. Resume when you&apos;re recovered — your study window continues from where you left off.</p>` +
    `<p style="margin:0 0 6px;"><strong>Completion rewards</strong></p>` +
    `<p style="margin:0 0 16px;">Participants who complete the full study receive partner fulfilment (where applicable — e.g. a 3-month supply of <strong>${productEsc}</strong> from <strong>${partnerBrand}</strong>) plus BioStackr Pro per the study terms.</p>` +
    `<p style="margin:0 0 20px;">Thank you for taking part — we&apos;ll translate your check-ins into a clear, personal summary at the end.</p>` +
    `<p style="margin:28px 0 0;text-align:center;">` +
    `<a href="${escapeHtml(dashboardHref)}"${COHORT_EMAIL_CTA_LINK_ATTRS} style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">View your study dashboard →</a>` +
    `</p>`

  const html = wrapCohortTransactionalEmailHtml({
    appBase,
    partnerBrandName: partnerPlain,
    innerHtml,
    dashboardHref,
    omitDashboardRow: true,
  })
  return { subject, html }
}

export async function sendCohortStudyStartEmail(params: {
  to: string
  authUserId: string
  productName: string
  partnerBrandName?: string | null
  /** Calendar length of the study window (for subject / copy). Defaults to 21. */
  studyDurationDays?: number
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const to = String(params.to || '').trim()
  if (!to) return { success: false, error: 'missing email' }
  const authUserId = String(params.authUserId || '').trim()
  if (!authUserId) return { success: false, error: 'missing user' }

  const product = String(params.productName || 'your study product').trim() || 'your study product'
  const partnerPlain = String(params.partnerBrandName ?? 'Study partner').trim() || 'Study partner'

  const { data: auth, error: auErr } = await supabaseAdmin.auth.admin.getUserById(authUserId)
  if (auErr || !auth?.user) {
    console.error('[cohort-study-start-email] auth', authUserId, auErr?.message)
  }
  const firstNameForGreeting = firstNameFromAuthUser(auth?.user ?? { email: to })

  const { subject, html } = buildCohortStudyStartTransactionalEmailHtml({
    firstNameForGreeting,
    productName: product,
    partnerBrandName: partnerPlain,
    studyDurationDays: params.studyDurationDays,
  })

  return sendEmail({ to, subject, html })
}
