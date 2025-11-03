export type DailyReminderTemplateParams = {
  userName: string
  pain: number
  mood: number
  sleep: number
  readinessPercent: number
  readinessEmoji: string
  readinessMessage: string
  supplementList: string[]
  checkInUrl: string
  magicUrl: string
  optOutUrl: string
  milestoneBanner?: string | null
}

function clamp01(v: number) { return Math.max(0, Math.min(1, v)) }
function pct10(v: number) { return `${Math.round(clamp01(v / 10) * 100)}%` }

function supplementEmoji(name: string): string {
  const s = (name || '').toLowerCase()
  if (s.includes('omega')) return '🐟'
  if (s.includes('sauna')) return '🔥'
  if (s.includes('mag')) return '🧴'
  return '💊'
}

export function getDailyReminderSubject(userName: string): string {
  const safe = (userName || '').trim() || 'there'
  return `${safe}, ready for your 20-second check-in?`
}

export function renderDailyReminderHTML(params: DailyReminderTemplateParams): string {
  const {
    userName,
    pain,
    mood,
    sleep,
    readinessPercent,
    readinessEmoji,
    readinessMessage,
    supplementList,
    checkInUrl,
    magicUrl,
    optOutUrl,
  } = params

  const bar = (label: string, value: number, color: string) => `
    <tr><td style="padding:0 0 8px 0; font-size:16px; line-height:24px; color:#101828;"><strong>${label}: ${Math.max(0, Math.min(10, Math.round(value)))}/10</strong></td></tr>
    <tr><td style="padding:0 0 10px 0;">
      <div style="width:100%; max-width:180px; height:18px; border:1px solid #E5E7EB; border-radius:6px; background:#FFFFFF;">
        <div style="width:${pct10(value)}; height:100%; background:${color}; border-radius:6px;"></div>
      </div>
    </td></tr>`

  const stackLines = (supplementList || []).map((s) => `${supplementEmoji(s)} ${s}`).join('<br/>') || '—'

  // Colors
  const purple = '#7C3AED'
  const purpleLightBg = '#EDE9FE'
  const purpleLightBorder = '#C4B5FD'

  return `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${getDailyReminderSubject(userName)}</title>
  </head>
  <body style="margin:0; padding:0; background:#FAFAFB; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FAFAFB;">
      <tr>
        <td align="center" style="padding:0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px; background:#FFFFFF; border-radius:16px; overflow:hidden;">
            <tr>
              <td style="padding:24px; font-family:Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#111827; line-height:1.7;">

                <div style="font-size:24px; font-weight:700; color:#111827; margin-bottom:8px;">Hey ${userName || 'there'} 👋</div>
                ${(() => {
                  // Opening messages per spec
                  let line1 = ''
                  if (pain > 6) {
                    line1 = `I noticed your pain was higher yesterday (${Math.max(0, Math.min(10, Math.round(pain)))}/10). Be gentle with yourself today.`
                  } else if (pain < 4) {
                    line1 = `I noticed your pain eased to ${Math.max(0, Math.min(10, Math.round(pain)))}/10 yesterday — great to see.`
                  } else {
                    line1 = `I noticed your pain was ${Math.max(0, Math.min(10, Math.round(pain)))}/10 yesterday, with mood ${Math.max(0, Math.min(10, Math.round(mood)))}/10 and sleep ${Math.max(0, Math.min(10, Math.round(sleep)))}/10.`
                  }

                  let line2 = ''
                  if (mood >= 7 && pain >= 6) {
                    line2 = `Your mood stayed steady despite the pain. Something's working.`
                  } else if (pain <= 3 && sleep >= 7) {
                    line2 = `Good sleep and low pain — nice combination.`
                  } else {
                    line2 = `Let's see how you're feeling today.`
                  }

                  return `<div style=\"font-size:16px; line-height:24px; color:#101828;\">${line1}<br/>${line2}</div>`
                })()}

                <div style="font-size:16px; font-weight:700; line-height:24px; color:#101828; margin:16px 0 8px;">Yesterday's Snapshot:</div>
                ${params.milestoneBanner ? `
                <div style="margin:16px 0 20px 0; padding:12px 14px; background:#EEF2FF; border:1px solid #C7D2FE; border-radius:10px; color:#1F2937; font-size:14px; line-height:22px;">
                  ${params.milestoneBanner}
                </div>` : ''}
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  ${bar('Pain', pain, '#F97316')}
                  ${bar('Mood', mood, '#16A34A')}
                  ${bar('Sleep', sleep, '#FACC15')}
                </table>
                <div style="margin: 24px 0; padding: 16px; background: #f9f9f9; border-radius: 8px;">
                  <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">📱 Haven't installed BioStackr yet?</p>
                  <p style="margin: 0 0 12px 0; font-size: 14px; color: #666;">Tap <strong>Install</strong> at the top when you open BioStackr. One tap and it's on your home screen with daily reminders—no App Store needed.</p>
                  <a href="${checkInUrl}" style="display: inline-block; padding: 12px 24px; background: #E8B86D; color: #000; text-decoration: none; border-radius: 6px; font-weight: 600;">Open BioStackr</a>
                </div>
                <div style="font-size:14px; line-height:22px; color:#475467; margin:0 0 12px 0;">Readiness: ${readinessEmoji} <strong>${Math.max(0, Math.min(100, Math.round(readinessPercent)))}%</strong> — ${readinessMessage}</div>

                <div style="height:1px; background:#ECEFF3; margin:20px 0;"></div>

                <div style="font-size:16px; font-weight:700; line-height:24px; color:#101828; margin:0 0 8px;">How are you feeling today?</div>
                <div style="font-size:16px; color:#4B5563; line-height:24px; margin:0 0 20px 0;">Your check-in takes just 20 seconds, or if it feels the same as yesterday, tap the Quick Save button.</div>

                <!-- Centered CTA row -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 0 auto;">
                  <tr>
                    <td style="padding-right:6px;">
                      <a href="${checkInUrl}" style="display:inline-block; width:150px; background:${purple}; color:#FFFFFF; text-decoration:none; border-radius:10px; padding:14px 16px; font-weight:500; text-align:center;">Check in</a>
                    </td>
                    <td style="padding-left:6px;">
                      <a href="${magicUrl}" style="display:inline-block; width:150px; background:${purpleLightBg}; color:${purple}; text-decoration:none; border-radius:10px; padding:14px 16px; font-weight:500; text-align:center; border:1px solid ${purpleLightBorder};">Quick Save</a>
                    </td>
                  </tr>
                </table>

                <div style="font-size:15px; font-style:normal; color:#6B7280; text-align:left; margin:20px 0 0 0;">The Quick Save button keeps your consistency visible and helps me spot patterns.<br/>Not every day needs effort. Consistency matters more than perfection.</div>

                <div style="height:1px; background:#ECEFF3; margin:28px 0 16px;"></div>

                <div style="font-size:16px; font-weight:700; line-height:24px; color:#101828; margin-bottom:8px;">Yesterday's Stack:</div>
                <div style="font-size:15px; color:#374151; line-height:24px;">${stackLines}</div>

                <div style="font-size:13px; color:#9CA3AF; margin-top:20px;">Want to stop daily emails? <a href="${optOutUrl}" style="color:${purple}; text-decoration:underline;">Turn them off here.</a></div>
                <div style="font-size:16px; font-weight:500; color:#374151; margin:24px 0 16px;">— Elli 💙</div>

              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}


