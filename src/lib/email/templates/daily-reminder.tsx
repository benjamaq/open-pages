import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import {
  COHORT_EMAIL_CTA_LINK_ATTRS,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'

export type DailyReminderEmailParams = {
  firstName: string
  supplementCount: number
  progressPercent: number
  checkinUrl: string
  /** Cohort `brand_name` for transactional shell (header + × BioStackr line). */
  partnerBrandName?: string | null
  /** Optional line under the CTA (hint usually omitted). */
  linkHint?: string | null
  // Optional daily metrics to display (Energy/Focus/Sleep/Mood on 1–10 scale)
  energy?: number
  focus?: number
  sleep?: number
  mood?: number
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Inner body only (no shell) — for tests or custom wrappers. */
export function renderDailyReminderInnerHtml(params: DailyReminderEmailParams): string {
  const { firstName, checkinUrl, linkHint } = params
  const hintBlock =
    linkHint != null && String(linkHint).trim() !== ''
      ? `<div style="font-size:12px;color:#6b7280;line-height:1.45;margin-top:12px;">${esc(linkHint)}</div>`
      : ''

  return (
    `<p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#1a1a1a;">Hey ${esc(firstName || 'there')},</p>` +
    `<p style="margin:0 0 22px;font-size:16px;color:#1a1a1a;line-height:1.65;">Time for your daily check-in. Three sliders, ten seconds.</p>` +
    `<p style="margin:0 0 24px;">` +
    `<a href="${esc(checkinUrl)}"${COHORT_EMAIL_CTA_LINK_ATTRS} style="display:inline-block;background:#C84B2F;color:#ffffff !important;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;">Check In Now</a>` +
    hintBlock +
    `</p>` +
    `<p style="margin:0 0 18px;font-size:14px;color:#374151;line-height:1.6;">Missed yesterday? No problem. Just pick up today. A few missed days won't affect your results.</p>` +
    `<p style="margin:0;font-size:14px;color:#1a1a1a;">— BioStackr</p>`
  )
}

/** Full HTML: shared cohort transactional shell (partner × BioStackr) + daily reminder body. */
export function renderDailyReminderEmail(params: DailyReminderEmailParams): string {
  const innerHtml = renderDailyReminderInnerHtml(params)
  const appBase = cohortEmailPublicOrigin()
  const dashboardHref = String(params.checkinUrl || '').trim() || `${appBase.replace(/\/$/, '')}/check-in`
  const partnerBrandName = String(params.partnerBrandName || '').trim() || 'Study partner'
  return wrapCohortTransactionalEmailHtml({
    appBase,
    partnerBrandName,
    innerHtml,
    dashboardHref,
    omitDashboardRow: true,
  })
}
