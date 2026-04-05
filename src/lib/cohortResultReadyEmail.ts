import { cohortParticipantResultPath } from '@/lib/cohortDashboardDeepLink'
import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import {
  COHORT_EMAIL_CTA_LINK_ATTRS,
  escapeHtml,
  firstNameFromAuthUser,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Result-ready / study-finished email: intro, results CTA, rewards (same copy as result page), DoNotAge × BioStackr shell.
 */
export async function sendCohortResultReadyEmail(params: {
  to: string
  authUserId: string
  productName: string
  partnerBrandName?: string | null
  rewardClaimAbsoluteUrl?: string | null
  proRewardAlreadyClaimed?: boolean
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const to = String(params.to || '').trim()
  if (!to) return { success: false, error: 'missing email' }
  const authUserId = String(params.authUserId || '').trim()
  if (!authUserId) return { success: false, error: 'missing user' }

  const product = String(params.productName || 'your study').trim() || 'your study'
  const productEsc = escapeHtml(product)

  const { data: auth, error: auErr } = await supabaseAdmin.auth.admin.getUserById(authUserId)
  if (auErr || !auth?.user) {
    console.error('[cohort-result-ready-email] auth', authUserId, auErr?.message)
  }
  const first = escapeHtml(firstNameFromAuthUser(auth?.user ?? { email: to }))

  const appBase = cohortEmailPublicOrigin()
  const resultHref = `${appBase}${cohortParticipantResultPath()}`
  const dashboardHref = `${appBase}${cohortParticipantResultPath()}`
  const subject = `Your ${productEsc} study — results are ready`

  const rewardClaimRaw = String(params.rewardClaimAbsoluteUrl || '').trim()
  const proAlready = Boolean(params.proRewardAlreadyClaimed)

  const intro =
    `<p style="margin:0 0 16px;">Hi ${first},</p>` +
    `<p style="margin:0 0 8px;color:#374151;font-size:16px;line-height:1.65;">Your personal results for the <strong>${productEsc}</strong> study are ready.</p>` +
    `<p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">Thank you for taking part. Your study is complete — no further check-ins are needed.</p>`

  const resultsCta =
    `<p style="margin:0 0 28px;text-align:center;">` +
    `<a href="${escapeHtml(resultHref)}"${COHORT_EMAIL_CTA_LINK_ATTRS} style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">View your results →</a>` +
    `</p>`

  const rewardsHeading =
    `<p style="margin:0;padding-top:20px;border-top:1px solid #e8e4de;font-size:13px;font-weight:600;color:#1a1a1a;">Your rewards</p>`

  const bioBlock = proAlready
    ? `<div style="margin:20px 0 0;">` +
      `<p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">BioStackr Pro</p>` +
      `<p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">You&apos;ve unlocked 3 months of BioStackr Pro.</p>` +
      `<p style="margin:12px 0 0;color:#6b7280;font-size:14px;line-height:1.5;">Your Pro access is already active on your account.</p>` +
      `</div>`
    : rewardClaimRaw !== ''
      ? `<div style="margin:20px 0 0;">` +
        `<p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">BioStackr Pro</p>` +
        `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">You&apos;ve unlocked 3 months of BioStackr Pro.</p>` +
        `<p style="margin:0;">` +
        `<a href="${escapeHtml(rewardClaimRaw)}"${COHORT_EMAIL_CTA_LINK_ATTRS} style="display:inline-block;background:#1e293b;color:#ffffff !important;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:15px;">Claim your Pro access →</a>` +
        `</p>` +
        `</div>`
      : `<div style="margin:20px 0 0;">` +
        `<p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">BioStackr Pro</p>` +
        `<p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">You&apos;ve unlocked 3 months of BioStackr Pro. Use the claim link from your study completion email, or open your results page while signed in.</p>` +
        `</div>`

  const sureBlock =
    `<div style="margin:28px 0 0;padding-top:22px;border-top:1px solid #eee;">` +
    `<p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">DoNotAge SureSleep</p>` +
    `<p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">You&apos;ll receive a 3-month supply of SureSleep.</p>` +
    `<p style="margin:12px 0 0;color:#374151;font-size:15px;line-height:1.6;">We&apos;ll ship it to the address you provided during signup.</p>` +
    `</div>`

  const innerHtml = intro + resultsCta + rewardsHeading + bioBlock + sureBlock

  const html = wrapCohortTransactionalEmailHtml({
    appBase,
    innerHtml,
    dashboardHref,
    omitDashboardRow: true,
  })

  return sendEmail({ to, subject, html })
}
