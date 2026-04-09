import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import {
  COHORT_EMAIL_CTA_LINK_ATTRS,
  escapeHtml,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'

export type DailyReminderEmailParams = {
  firstName: string
  supplementCount: number
  progressPercent: number
  checkinUrl: string
  /**
   * When true, cohort partner × BioStackr transactional shell (magic-link cohort users).
   * When false, plain BioStackr shell only (no study partner language).
   */
  cohortTransactionalShell: boolean
  /** Cohort `brand_name` for transactional shell; ignored when `cohortTransactionalShell` is false. */
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

/** Plain BioStackr wrapper — no partner column, no “Study partner × BioStackr” line or study footer copy. */
function wrapBioStackrDailyReminderHtml(opts: {
  appBase: string
  innerHtml: string
}): string {
  const base = opts.appBase.replace(/\/$/, '')
  const biostackr = `${base}/${encodeURI('BIOSTACKR LOGO 2.png')}`
  const logoSrc = escapeHtml(biostackr)
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;padding:0;background:#f4f3f1;-webkit-text-size-adjust:100%;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f3f1;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e4de;">
        <tr>
          <td align="center" style="padding:20px 22px 18px;border-bottom:1px solid #e8e4de;background:#ffffff;">
            <img src="${logoSrc}" alt="BioStackr" width="168" style="display:block;max-width:168px;width:168px;height:auto;margin:0 auto;border:0;" />
          </td>
        </tr>
        <tr>
          <td style="padding:26px 22px 8px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.65;color:#1a1a1a;">
${opts.innerHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 22px 26px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;line-height:1.55;color:#4b5563;border-top:1px solid #eee;background:#fafaf9;">
            <strong style="color:#1a1a1a;">BioStackr</strong><br />
            Track supplements, protocols, and how you feel — all in one place.<br />
            Your data stays private and is only used to improve your experience.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

/** Full HTML: cohort transactional shell or plain BioStackr shell + daily reminder body. */
export function renderDailyReminderEmail(params: DailyReminderEmailParams): string {
  const innerHtml = renderDailyReminderInnerHtml(params)
  const appBase = cohortEmailPublicOrigin()
  if (!params.cohortTransactionalShell) {
    return wrapBioStackrDailyReminderHtml({ appBase, innerHtml })
  }
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
