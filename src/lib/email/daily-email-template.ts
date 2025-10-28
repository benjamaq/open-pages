export type DailyEmailParams = {
  userName: string
  pain: number
  mood: number
  sleep: number
  readinessScore: number
  readinessEmoji: string
  readinessMessage: string
  insightLine: string
  supplementList: string[]
  magicUrl: string
  checkInUrl: string
  optOutUrl: string
}

function clampToRange(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.max(min, Math.min(max, value))
}

function percentFromTenScale(value: number): number {
  const v = clampToRange(Math.round(value), 0, 10)
  return Math.round((v / 10) * 100)
}

function renderMeterRow(label: string, value: number, color: string): string {
  const pct = percentFromTenScale(value)
  const remainder = 100 - pct
  return `
    <tr>
      <td style="padding:8px 0 4px 0; font-size:14px; color:#111827;">${label}
        <span style="color:#6B7280; font-size:12px;">&nbsp;${clampToRange(value,0,10)}/10</span>
      </td>
    </tr>
    <tr>
      <td>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td width="${pct}%" style="background:${color}; height:8px; line-height:8px; font-size:0;">&nbsp;</td>
            <td width="${remainder}%" style="background:#E5E7EB; height:8px; line-height:8px; font-size:0;">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

function renderSupplements(list: string[]): string {
  if (!list || list.length === 0) return '<tr><td style="font-size:14px; color:#6B7280;">No supplements added yet.</td></tr>'
  const items = list.map((item) => {
    // Try to choose a lightweight emoji based on simple keywords
    const lower = (item || '').toLowerCase()
    let emoji = '🧴'
    if (lower.includes('magnesium')) emoji = '🧲'
    else if (lower.includes('omega') || lower.includes('fish')) emoji = '🐟'
    else if (lower.includes('vitamin')) emoji = '💊'
    else if (lower.includes('sauna')) emoji = '🔥'
    else if (lower.includes('sleep')) emoji = '😴'
    return `<tr><td style="padding:6px 0; font-size:14px; color:#111827;">${emoji}&nbsp;&nbsp;${item}</td></tr>`
  }).join('')
  return items
}

export function renderDailyEmailHTML(params: DailyEmailParams): string {
  const {
    userName,
    pain,
    mood,
    sleep,
    readinessScore,
    readinessEmoji,
    readinessMessage,
    insightLine,
    supplementList,
    magicUrl,
    checkInUrl,
    optOutUrl,
  } = params

  const safeName = (userName || '').trim() || 'there'
  const readinessPct = clampToRange(Math.round(readinessScore), 0, 100)

  return `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Daily Check-in</title>
  </head>
  <body style="margin:0; padding:0; background:#F3F4F6; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F3F4F6;">
      <tr>
        <td align="center" style="padding:24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden;">
            <tr>
              <td style="padding:24px 24px 8px 24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <div style="font-size:20px; line-height:28px; color:#111827; font-weight:700;">Daily Check-in</div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 12px 24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <div style="font-size:15px; line-height:22px; color:#111827;">Hey ${safeName} 👋</div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 16px 24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <div style="font-size:14px; line-height:22px; color:#374151;">${insightLine || "I'm tracking your patterns to find what helps."}</div>
              </td>
            </tr>

            <!-- Yesterday's Snapshot -->
            <tr>
              <td style="padding:0 24px 8px 24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <div style="font-size:14px; font-weight:700; color:#111827; margin:0 0 6px 0;">Yesterday's Snapshot</div>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                  ${renderMeterRow('Pain', clampToRange(pain,0,10), '#EF4444')}
                  ${renderMeterRow('Mood', clampToRange(mood,0,10), '#10B981')}
                  ${renderMeterRow('Sleep', clampToRange(sleep,0,10), '#6366F1')}
                </table>
              </td>
            </tr>

            <!-- Readiness -->
            <tr>
              <td style="padding:8px 24px 16px 24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; background:#F9FAFB; border:1px solid #E5E7EB; border-radius:8px;">
                  <tr>
                    <td style="padding:12px 14px; font-size:14px; color:#111827;">
                      <span style="font-weight:700;">Readiness</span>
                      <span style="font-size:13px; color:#6B7280;">&nbsp;${readinessEmoji || ''}&nbsp;${readinessPct}% — ${readinessMessage || ''}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA Buttons -->
            <tr>
              <td align="center" style="padding:8px 24px 8px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                  <tr>
                    <td align="center" style="padding:6px 0;">
                      <a href="${checkInUrl}" target="_blank" rel="noopener" style="display:inline-block; background:#3B82F6; color:#ffffff; text-decoration:none; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:20px; padding:12px 18px; border-radius:8px; font-weight:700;">Check In Now (20 seconds)</a>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:6px 0;">
                      <a href="${magicUrl}" target="_blank" rel="noopener" style="display:inline-block; background:#F3F4F6; color:#111827; text-decoration:none; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:20px; padding:12px 18px; border-radius:8px; border:1px solid #E5E7EB; font-weight:600;">Same as Yesterday</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Today's Stack -->
            <tr>
              <td style="padding:8px 24px 8px 24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <div style="font-size:14px; font-weight:700; color:#111827; margin:0 0 6px 0;">Today's Stack</div>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  ${renderSupplements(supplementList)}
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:16px 24px 24px 24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <div style="font-size:12px; line-height:18px; color:#6B7280;">
                  Not up for a check-in today? No stress — the "Same as Yesterday" button keeps your streak alive.<br/>
                  Want to stop daily emails? <a href="${optOutUrl}" target="_blank" rel="noopener" style="color:#3B82F6; text-decoration:underline;">Turn them off here</a>.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}


