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

/** Table-based shell: works in Gmail mobile + desktop. */
export function wrapCohortTransactionalEmailHtml(opts: { appBase: string; innerHtml: string }): string {
  const { donotage, biostackr } = cohortEmailPublicLogoUrls(opts.appBase)
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
