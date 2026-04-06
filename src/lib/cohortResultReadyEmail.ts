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
    `<p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">Thanks for finishing the study. You&apos;re all set — no more check-ins.</p>`

  const resultsCta =
    `<p style="margin:0 0 28px;text-align:center;">` +
    `<a href="${escapeHtml(resultHref)}"${COHORT_EMAIL_CTA_LINK_ATTRS} style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">View your results</a>` +
    `</p>`

  const rewardsSectionOpen =
    `<div style="margin:32px 0 0;padding:24px 20px 22px;border-top:2px solid #e2e8f0;background:#f1f5f9;border-radius:10px;">` +
    `<p style="margin:0 0 18px;font-size:18px;font-weight:700;color:#111827;line-height:1.3;">Your rewards</p>`

  const bioBlockSep = `margin:22px 0 0;padding:16px 0 0;border-top:1px dashed #cbd5e1;`
  const bioBlock = proAlready
    ? `<div style="${bioBlockSep}">` +
      `<p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">BioStackr Pro</p>` +
      `<p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">You&apos;ve unlocked 3 months of BioStackr Pro.</p>` +
      `<p style="margin:12px 0 0;color:#4b5563;font-size:14px;line-height:1.55;">Your BioStackr Pro access is now active on this account. You can start using Pro features right away.</p>` +
      `</div>`
    : rewardClaimRaw !== ''
      ? `<div style="${bioBlockSep}">` +
        `<p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">BioStackr Pro</p>` +
        `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">You&apos;ve unlocked 3 months of BioStackr Pro.</p>` +
        `<p style="margin:0;">` +
        `<a href="${escapeHtml(rewardClaimRaw)}"${COHORT_EMAIL_CTA_LINK_ATTRS} style="display:inline-block;background:#1e293b;color:#ffffff !important;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:15px;">Claim your Pro access</a>` +
        `</p>` +
        `<p style="margin:14px 0 0;color:#6b7280;font-size:13px;line-height:1.5;">You can also claim from your results page while signed in.</p>` +
        `</div>`
      : `<div style="${bioBlockSep}">` +
        `<p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">BioStackr Pro</p>` +
        `<p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">You&apos;ve unlocked 3 months of BioStackr Pro.</p>` +
        `<p style="margin:0;color:#6b7280;font-size:14px;line-height:1.55;">Open your results while signed in to claim in one step. If you use a claim link, sign in with the same study account.</p>` +
        `</div>`

  const sureBlock =
    `<div style="margin:0;">` +
    `<p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">DoNotAge SureSleep</p>` +
    `<p style="margin:0;color:#4b5563;font-size:14px;line-height:1.6;">Your 3-month supply of SureSleep will be shipped automatically to the address you provided during signup.</p>` +
    `</div>`

  const rewardsSectionClose = `</div>`

  const innerHtml = intro + resultsCta + rewardsSectionOpen + sureBlock + bioBlock + rewardsSectionClose

  const html = wrapCohortTransactionalEmailHtml({
    appBase,
    innerHtml,
    dashboardHref,
    omitDashboardRow: true,
  })

  return sendEmail({ to, subject, html })
}
