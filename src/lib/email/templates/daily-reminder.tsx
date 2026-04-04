import { COHORT_EMAIL_CTA_LINK_ATTRS } from '@/lib/cohortTransactionalEmailHtml'

export type DailyReminderEmailParams = {
  firstName: string
  supplementCount: number
  progressPercent: number
  checkinUrl: string
  /** Optional line under the CTA (cohort daily emails use stable `/check-in`; hint usually omitted). */
  linkHint?: string | null
  // Optional daily metrics to display (Energy/Focus/Sleep/Mood on 1–10 scale)
  energy?: number
  focus?: number
  sleep?: number
  mood?: number
}

function esc(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function renderDailyReminderEmail(params: DailyReminderEmailParams): string {
  const { firstName, checkinUrl, linkHint } = params
  const hintBlock =
    linkHint != null && String(linkHint).trim() !== ''
      ? `<div style="font-size:12px;color:#6b7280;line-height:1.45;margin-top:12px;">${esc(linkHint)}</div>`
      : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quick check-in</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f0;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:500px; background-color:#ffffff; border-radius:12px;">
          <tr>
            <td style="padding: 40px; text-align:left;">
              
              <div style="font-size:18px; font-weight:600; color:#1a1a1a; margin-bottom:14px;">
                Hey ${esc(firstName || 'there')},
              </div>
              
              <div style="font-size:16px; color:#1a1a1a; line-height:1.6; margin-bottom:22px;">
                Time for your daily check-in. Three sliders, ten seconds.
              </div>
              
              <div style="margin-bottom:24px;">
                <a href="${esc(checkinUrl)}"${COHORT_EMAIL_CTA_LINK_ATTRS} style="display:inline-block; background:#3A2F2A; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:700; font-size:14px;">Check In Now</a>
                ${hintBlock}
              </div>

              <div style="font-size:14px; color:#374151; line-height:1.6; margin-bottom:18px;">
                Missed yesterday? No problem. Just pick up today. A few missed days won't affect your results.
              </div>
              
              <div style="font-size:14px; color:#1a1a1a;">
                — BioStackr
              </div>
              
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

