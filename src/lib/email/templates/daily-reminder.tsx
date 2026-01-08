export type DailyReminderEmailParams = {
  firstName: string
  supplementCount: number
  progressPercent: number
  checkinUrl: string
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
  const { firstName, supplementCount, progressPercent, checkinUrl } = params
  const energy = typeof params.energy === 'number' ? Math.max(0, Math.min(10, Math.round(params.energy))) : null
  const focus  = typeof params.focus  === 'number' ? Math.max(0, Math.min(10, Math.round(params.focus)))  : null
  const sleep  = typeof params.sleep  === 'number' ? Math.max(0, Math.min(10, Math.round(params.sleep)))  : null
  const mood   = typeof params.mood   === 'number' ? Math.max(0, Math.min(10, Math.round(params.mood)))   : null

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(String(progressPercent))}% complete</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f0;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:500px; background-color:#ffffff; border-radius:12px;">
          <tr>
            <td style="padding: 40px; text-align:left;">
              
              <div style="font-size:22px; font-weight:600; color:#1a1a1a; margin-bottom:20px;">
                Good morning, ${esc(firstName || 'there')}.
              </div>
              
              <div style="font-size:16px; color:#1a1a1a; line-height:1.6; margin-bottom:8px;">
                ${esc(String(supplementCount))} ${supplementCount === 1 ? 'supplement' : 'supplements'} under review.
              </div>
              
              <div style="font-size:16px; color:#1a1a1a; line-height:1.6; margin-bottom:8px;">
                Clarity: ${esc(String(progressPercent))}% complete.
              </div>
              
              ${(() => {
                if (energy == null && focus == null && sleep == null && mood == null) return ''
                const row = (label: string, value: number | null) =>
                  value == null
                    ? ''
                    : `<div style="font-size:15px; color:#1a1a1a; line-height:1.6; margin-bottom:4px;">${label}: ${esc(String(value))}/10</div>`
                return `
                  <div style="margin:14px 0 6px 0;">
                    ${row('Energy', energy)}
                    ${row('Focus', focus)}
                    ${row('Sleep', sleep)}
                    ${row('Mood', mood)}
                  </div>
                `
              })()}

              <div style="font-size:16px; color:#1a1a1a; line-height:1.6; margin-bottom:24px;">
                Check in today to move closer to saving money.
              </div>
              
              <div style="margin-bottom:30px;">
                <a href="${esc(checkinUrl)}" style="display:inline-block; background:#3A2F2A; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:6px; font-weight:600; font-size:14px; margin-right:12px;">Check in</a>
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

