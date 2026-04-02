/**
 * Shared HTML layout for DoNotAge × BioStackr cohort transactional emails (Resend).
 * Image URLs must be absolute — uses NEXT_PUBLIC_APP_URL (or biostackr.io fallback).
 */

export function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function firstNameFromAuthUser(user: {
  user_metadata?: Record<string, unknown> | null
  email?: string | null
}): string {
  const m = user.user_metadata || {}
  if (typeof m.first_name === 'string' && m.first_name.trim()) return m.first_name.trim()
  if (typeof m.name === 'string' && m.name.trim()) return m.name.trim().split(/\s+/)[0] || 'there'
  if (typeof m.full_name === 'string' && m.full_name.trim()) return m.full_name.trim().split(/\s+/)[0] || 'there'
  const em = user.email ? String(user.email).split('@')[0] : ''
  return em || 'there'
}

function cohortEmailPublicLogoUrls(appBase: string): { donotage: string; biostackr: string } {
  const base = appBase.replace(/\/$/, '')
  return {
    donotage: `${base}/DNA-logo-black.png`,
    biostackr: `${base}/${encodeURI('BIOSTACKR LOGO 2.png')}`,
  }
}

/** Shared CTA for simple (non-shell) cohort emails — magic or plain `dashboardHref`. */
export function cohortEmailDashboardCtaHtml(dashboardHref: string): string {
  const href = escapeHtml(dashboardHref)
  return (
    `<p style="margin:28px 0 0;text-align:center;">` +
    `<a href="${href}" style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">Go to your dashboard →</a>` +
    `</p>` +
    `<p style="margin:12px 0 0;text-align:center;font-size:12px;line-height:1.45;color:#6b7280;">` +
    `Use this link on your phone — you won&apos;t need to enter your password again.` +
    `</p>`
  )
}

/** Table-based shell: works in Gmail mobile + desktop. */
export function wrapCohortTransactionalEmailHtml(opts: {
  appBase: string
  innerHtml: string
  /** Magic link from `resolveCohortDashboardEmailHref`, or plain dashboard URL fallback. */
  dashboardHref: string
}): string {
  const { donotage, biostackr } = cohortEmailPublicLogoUrls(opts.appBase)
  const dash = escapeHtml(opts.dashboardHref)
  const dashboardRow = `<tr>
          <td style="padding:18px 22px 8px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;border-top:1px solid #eee;background:#ffffff;">
            <p style="margin:0;text-align:center;">
              <a href="${dash}" style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">Go to your dashboard →</a>
            </p>
            <p style="margin:10px 0 0;text-align:center;font-size:12px;line-height:1.45;color:#6b7280;">
              Use this link on your phone — you won&apos;t need to enter your password again.
            </p>
          </td>
        </tr>`
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
          <td style="padding:20px 22px 18px;border-bottom:1px solid #e8e4de;background:#ffffff;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td align="left" valign="middle" style="width:52%;padding:0 6px 0 0;">
                  <img src="${donotage}" alt="DoNotAge" width="132" style="display:block;max-width:132px;width:132px;height:auto;border:0;" />
                </td>
                <td align="right" valign="middle" style="width:48%;padding:0;">
                  <img src="${biostackr}" alt="BioStackr" width="168" style="display:block;max-width:168px;width:168px;height:auto;margin-left:auto;border:0;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:26px 22px 8px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.65;color:#1a1a1a;">
${opts.innerHtml}
          </td>
        </tr>
        ${dashboardRow}
        <tr>
          <td style="padding:20px 22px 26px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;line-height:1.55;color:#4b5563;border-top:1px solid #eee;background:#fafaf9;">
            <strong style="color:#1a1a1a;">DoNotAge × BioStackr</strong><br />
            Running a real-world customer outcomes study.<br />
            Your data stays private and is only used in anonymised analysis.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}
