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

// V2 – Final refined design per brief
export function getDailyEmailSubjectV2(userName: string, pain: number): string {
  const safeName = (userName || '').trim() || 'there'
  const p = clampToRange(Math.round(pain), 0, 10)
  return `${safeName}, your check-in is ready. Pain at ${p}/10 yesterday.`
}

export function renderDailyEmailHTMLv2(params: DailyEmailParams): string {
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
  const p = clampToRange(pain, 0, 10)
  const m = clampToRange(mood, 0, 10)
  const s = clampToRange(sleep, 0, 10)
  const readinessPct = clampToRange(Math.round(readinessScore), 0, 100)

  const suppRows = renderSupplements(supplementList)

  return `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${getDailyEmailSubjectV2(safeName, p)}</title>
  </head>
  <body style="margin:0; padding:0; background:#fffdfb; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fffdfb;">
      <tr>
        <td align="center" style="padding:24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #F3F4F6;">
            <tr>
              <td style="padding:24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#111827;">
                <!-- Opening -->
                <div style="font-size:15px; line-height:22px;">
                  <div style="margin-bottom:10px;">Hey ${safeName}, I checked your last entry.</div>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; background:#FFFFFF; border:1px solid #E5E7EB; border-radius:10px;">
                    <tr><td style="padding:12px 14px; font-size:14px; color:#111827;">Yesterday you checked in with:</td></tr>
                    <tr><td style="padding:0 14px 12px 14px;">
                      <div style="font-size:14px; color:#111827;">Pain&nbsp; <strong>${p}/10</strong></div>
                      <div style="font-size:14px; color:#111827;">Mood&nbsp; <strong>${m}/10</strong></div>
                      <div style="font-size:14px; color:#111827;">Sleep&nbsp; <strong>${s}/10</strong></div>
                    </td></tr>
                  </table>
                  <div style="margin-top:12px;">How are you feeling today?</div>
                </div>

                <!-- Action section -->
                <div style="font-size:14px; line-height:22px; color:#374151; margin-top:16px;">
                  Your check-in takes just 20 seconds — or if today feels the same,
                  just tap the Quick Save button below.
                </div>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:12px;">
                  <tr>
                    <td align="center" style="padding:6px 0;">
                      <a href="${checkInUrl}" target="_blank" rel="noopener" style="display:block; width:100%; max-width:560px; background:#4F8FF7; color:#ffffff; text-decoration:none; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:22px; padding:14px 18px; border-radius:12px; font-weight:700; text-align:center;">💬 Check In Now (20 seconds)</a>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:6px 0;">
                      <a href="${magicUrl}" target="_blank" rel="noopener" style="display:inline-block; background:#E5E7EB; color:#111827; text-decoration:none; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:20px; padding:10px 16px; border-radius:12px; border:1px solid #E5E7EB; font-weight:600;">🕊️ Feels the Same as Yesterday</a>
                    </td>
                  </tr>
                </table>

                <div style="font-size:13px; color:#6B7280; margin-top:8px;">
                  The Quick Save button keeps your <strong>consistency</strong> visible and helps me spot patterns. No pressure, just progress.
                </div>

                <!-- Insight (optional one-liner) -->
                ${insightLine ? `<div style="font-size:14px; color:#111827; margin-top:16px;">${insightLine}</div>` : ''}

                <!-- Today's Stack -->
                <div style="font-size:14px; font-weight:700; color:#111827; margin:18px 0 6px 0;">Today's Stack</div>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  ${suppRows}
                </table>

                <!-- Footer / signature -->
                <div style="font-size:14px; color:#111827; margin-top:16px;">Want to stop daily emails? <a href="${optOutUrl}" target="_blank" rel="noopener" style="color:#4F8FF7; text-decoration:underline;">Turn them off here</a>.</div>
                <div style="font-size:14px; color:#111827; margin-top:16px;">— Elli 💙</div>
                <div style="font-size:13px; color:#6B7280; margin-top:10px;">P.S. Based on yesterday's input, I'm thinking your capacity might be around ${readinessPct}% today ${readinessEmoji} — but let's see what you actually feel.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

// V3 – Elegant Apple-level design per refined spec (max 560px, warm white, precise spacing)
export function getDailyEmailSubjectV3(userName: string): string {
  const safe = (userName || '').trim() || 'there'
  return `${safe}, ready for your 20-second check-in?`
}

export function renderDailyEmailHTMLv3(params: DailyEmailParams): string {
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
  const p = clampToRange(pain, 0, 10)
  const m = clampToRange(mood, 0, 10)
  const s = clampToRange(sleep, 0, 10)
  const readinessPct = clampToRange(Math.round(readinessScore), 0, 100)

  // helper to render a single meter row
  const meter = (label: string, value: number, color: string) => {
    const pct = percentFromTenScale(value)
    return `
    <tr>
      <td style="padding:0 0 16px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="width:80px; font-size:14px; font-weight:500; color:#6B7280;">${label}</td>
            <td style="font-size:18px; font-weight:600; color:#111827; padding-right:12px;">${clampToRange(value,0,10)}/10</td>
            <td style="width:100%;">
              <div style="width:100%; height:8px; background:#E5E7EB; border-radius:4px; overflow:hidden;">
                <div style="width:${pct}%; height:8px; background:${color}; border-radius:4px;"></div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
  }

  const suppItems = (supplementList || []).map((item) => {
    const lower = (item || '').toLowerCase()
    let emoji = '🧴'
    if (lower.includes('omega')) emoji = '🐟'
    else if (lower.includes('turmeric') || lower.includes('curcumin')) emoji = '🧪'
    else if (lower.includes('sauna')) emoji = '🔥'
    else if (lower.includes('sleep')) emoji = '😴'
    return `<tr><td style="font-size:15px; color:#374151; padding:0 0 8px 0;"><span style="font-size:18px; margin-right:12px;">${emoji}</span>${item}</td></tr>`
  }).join('') || '<tr><td style="font-size:15px; color:#6B7280;">No items yet.</td></tr>'

  return `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${getDailyEmailSubjectV3(safeName)}</title>
  </head>
  <body style="margin:0; padding:0; background:#FFFDFB; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FFFDFB;">
      <tr>
        <td align="center" style="padding:24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px; background:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid #F3F4F6;">
            <tr>
              <td style="padding:40px 24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#111827; line-height:1.7;">

                <!-- Greeting -->
                <div style="font-size:24px; font-weight:600; color:#111827; margin-bottom:8px;">Hey ${safeName} 👋</div>
                <div style="font-size:17px; color:#374151; line-height:1.6; margin-bottom:24px;">I noticed your pain was ${p}/10 yesterday, with mood ${m}/10 and sleep ${s}/10. Small wins matter.</div>

                <!-- Yesterday's Snapshot header -->
                <div style="font-size:14px; font-weight:600; color:#6B7280; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px;">Yesterday's Snapshot</div>

                <!-- Snapshot Card -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:0; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                  <tr>
                    <td style="padding:24px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        ${meter('Pain', p, '#EF4444')}
                        ${meter('Mood', m, '#10B981')}
                        ${meter('Sleep', s, '#6366F1')}
                        <tr>
                          <td style="padding-top:16px; border-top:1px solid #E2E8F0; font-size:16px; font-weight:500; color:#111827;">
                            Readiness: ${readinessEmoji || ''} ${readinessPct}% — ${readinessMessage || ''}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top:12px; font-size:15px; font-style:italic; color:#6B7280;">${insightLine || "Your body's still catching up — a good day to be gentle with yourself."}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Prompt -->
                <div style="margin-top:32px; font-size:16px; color:#4B5563;">How are you feeling today?</div>
                <div style="margin-top:16px; font-size:16px; color:#4B5563;">Your check-in takes just 20 seconds — or if today feels the same, just tap the Quick Save button below.</div>

                <!-- Buttons -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:32px 0;">
                  <tr>
                    <td>
                      <a href="${checkInUrl}" target="_blank" rel="noopener" style="display:block; width:100%; height:56px; background:#6366F1; color:#FFFFFF; border-radius:16px; border:2px solid #6366F1; text-decoration:none; font-weight:600; font-size:16px; text-align:center; line-height:56px; box-shadow:0 2px 4px rgba(99,102,241,0.15);">💬 <span style="margin-left:8px;">Check In Now (20 seconds)</span></a>
                    </td>
                  </tr>
                  <tr>
                    <td style="height:12px; line-height:12px; font-size:0;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td>
                      <a href="${magicUrl}" target="_blank" rel="noopener" style="display:block; width:100%; height:56px; background:#FFFFFF; color:#6B7280; border-radius:16px; border:2px solid #E5E7EB; text-decoration:none; font-weight:600; font-size:16px; text-align:center; line-height:56px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">🕊️ <span style="margin-left:8px;">Feels the Same as Yesterday</span></a>
                    </td>
                  </tr>
                </table>

                <div style="font-size:14px; color:#6B7280; line-height:1.6; text-align:center; max-width:480px; margin:16px auto 0;">The Quick Save button keeps your <span style="font-weight:600; color:#374151;">consistency</span> visible and helps me spot patterns. No pressure, just progress.</div>

                <!-- Today's Stack -->
                <div style="margin:32px 0 12px 0; font-size:14px; font-weight:600; color:#6B7280; text-transform:uppercase; letter-spacing:0.5px;">Today's Stack</div>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FFFFFF; border:1px solid #F3F4F6; border-radius:8px; padding:20px;">
                  <tr><td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      ${suppItems}
                    </table>
                  </td></tr>
                </table>

                <!-- Footer quote -->
                <div style="font-size:15px; font-style:italic; color:#6B7280; text-align:center; margin:32px 0 20px; line-height:1.6;">Not every day needs effort. Consistency matters more than perfection.</div>
                <div style="font-size:13px; color:#9CA3AF; text-align:center;">Want to stop daily emails? <a href="${optOutUrl}" target="_blank" rel="noopener" style="color:#9CA3AF; text-decoration:underline;">Turn them off here</a></div>
                <div style="font-size:16px; font-weight:500; color:#374151; text-align:center; margin:24px 0 16px;">— Elli 💙</div>
                <div style="font-size:14px; color:#9CA3AF; font-style:italic; line-height:1.6; padding-top:16px; border-top:1px solid #F3F4F6;">P.S. Based on yesterday's input, I'm thinking your capacity might be around ${readinessPct}% today ${readinessEmoji} — but let's see what you actually feel.</div>

              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}


