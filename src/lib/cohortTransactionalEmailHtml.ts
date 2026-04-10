/**
 * Shared HTML layout for partner × BioStackr cohort transactional emails (Resend).
 * Image URLs must be absolute — callers should pass `appBase` from `cohortEmailPublicOrigin()`.
 */

/** @deprecated Use cohortEmailPartnerXBioStackrLine(partnerBrandName) with cohort `brand_name`. */
export const COHORT_EMAIL_BRAND_LINE = 'Study partner × BioStackr'

/** Helper line under dashboard CTAs in cohort transactional emails. */
export const COHORT_EMAIL_MAGIC_LINK_HINT = 'This link logs you straight in — no password needed.'

/**
 * Open CTAs in the topmost window so Gmail / in-app “preview” panes don’t trap auth in an iframe
 * or isolated context where session cookies don’t match a full-tab sign-in.
 * (Prefer over target="_blank" for email links that must complete PKCE / cookie auth.)
 */
export const COHORT_EMAIL_CTA_LINK_ATTRS = ' target="_top" rel="noopener noreferrer"'

/** Canonical partner × platform line (Unicode ×). */
export function cohortEmailPartnerXBioStackrLine(partnerBrandName: string): string {
  const p = String(partnerBrandName || '').trim() || 'Study partner'
  return `${p} × BioStackr`
}

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

/** Left header cell: partner logo when we ship assets (DoNotAge, Seeking Health); else wordmark text. */
export function cohortEmailPartnerHeaderCellHtml(appBase: string, partnerBrandName: string): string {
  const base = appBase.replace(/\/$/, '')
  const p = String(partnerBrandName || '').trim()
  if (/donotage/i.test(p)) {
    const logo = `${base}/DNA-logo-black.png`
    return `<td align="left" valign="middle" style="width:52%;padding:0 6px 0 0;">
                  <img src="${escapeHtml(logo)}" alt="${escapeHtml(p || 'Partner')}" width="132" style="display:block;max-width:132px;width:132px;height:auto;border:0;" />
                </td>`
  }
  if (/seeking\s*health/i.test(p)) {
    const logo = `${base}/cohorts/seeking-health/logo.png`
    return `<td align="left" valign="middle" style="width:52%;padding:0 6px 0 0;">
                  <img src="${escapeHtml(logo)}" alt="${escapeHtml(p || 'Seeking Health')}" width="160" style="display:block;max-width:160px;width:160px;height:auto;border:0;" />
                </td>`
  }
  const label = escapeHtml(p || 'Study partner')
  return `<td align="left" valign="middle" style="width:52%;padding:0 6px 0 0;">
                  <span style="font-size:15px;font-weight:700;color:#111827;display:block;max-width:200px;line-height:1.25;">${label}</span>
                </td>`
}

function cohortEmailBioStackrHeaderCellHtml(appBase: string): string {
  const base = appBase.replace(/\/$/, '')
  const biostackr = `${base}/${encodeURI('BIOSTACKR LOGO 2.png')}`
  return `<td align="right" valign="middle" style="width:48%;padding:0;">
                  <img src="${biostackr}" alt="BioStackr" width="168" style="display:block;max-width:168px;width:168px;height:auto;margin-left:auto;border:0;" />
                </td>`
}

/** Shared CTA for simple (non-shell) cohort emails (legacy magic-link dashboards — prefer `cohortEmailCheckInCtaHtml`). */
export function cohortEmailDashboardCtaHtml(dashboardHref: string): string {
  const href = escapeHtml(dashboardHref)
  return (
    `<p style="margin:28px 0 0;text-align:center;">` +
    `<a href="${href}"${COHORT_EMAIL_CTA_LINK_ATTRS} style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">View your study dashboard →</a>` +
    `</p>` +
    `<p style="margin:12px 0 0;text-align:center;font-size:12px;line-height:1.45;color:#6b7280;">` +
    escapeHtml(COHORT_EMAIL_MAGIC_LINK_HINT) +
    `</p>`
  )
}

/** Primary check-in CTA — URL is often magic `/auth/callback?token_hash=…` from `cohortTransactionalCheckinMagicHref`. */
export function cohortEmailCheckInCtaHtml(
  absoluteCheckInUrl: string,
  ctaLabel: string = 'Continue to your check-in →',
): string {
  const href = escapeHtml(absoluteCheckInUrl)
  const label = escapeHtml(ctaLabel)
  return (
    `<p style="margin:28px 0 0;text-align:center;">` +
    `<a href="${href}"${COHORT_EMAIL_CTA_LINK_ATTRS} style="display:inline-block;background:#111827;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:16px;letter-spacing:0.01em;">${label}</a>` +
    `</p>` +
    `<p style="margin:14px 0 0;text-align:center;font-size:12px;line-height:1.5;color:#6b7280;">` +
    escapeHtml(COHORT_EMAIL_MAGIC_LINK_HINT) +
    `</p>`
  )
}

/** Table-based shell: works in Gmail mobile + desktop. */
export function wrapCohortTransactionalEmailHtml(opts: {
  appBase: string
  /** Cohort `brand_name` (e.g. DoNotAge, Seeking Health) — drives header wordmark / logo and × BioStackr line. */
  partnerBrandName: string
  innerHtml: string
  /** Footer / shell link — e.g. stable `cohortEmailCheckInLandingAbsoluteUrl()` for cohort emails. */
  dashboardHref: string
  /** Set true when innerHtml already includes the dashboard button + hint (e.g. post-check-in 1). */
  omitDashboardRow?: boolean
}): string {
  const brandLine = cohortEmailPartnerXBioStackrLine(opts.partnerBrandName)
  const partnerCell = cohortEmailPartnerHeaderCellHtml(opts.appBase, opts.partnerBrandName)
  const bioCell = cohortEmailBioStackrHeaderCellHtml(opts.appBase)
  const dash = escapeHtml(opts.dashboardHref)
  const dashboardRow = opts.omitDashboardRow
    ? ''
    : `<tr>
          <td style="padding:18px 22px 8px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;border-top:1px solid #eee;background:#ffffff;">
            <p style="margin:0;text-align:center;">
              <a href="${dash}"${COHORT_EMAIL_CTA_LINK_ATTRS} style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">View your study dashboard →</a>
            </p>
            <p style="margin:10px 0 0;text-align:center;font-size:12px;line-height:1.45;color:#6b7280;">
              ${escapeHtml(COHORT_EMAIL_MAGIC_LINK_HINT)}
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
                ${partnerCell}
                ${bioCell}
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 22px 16px;border-bottom:1px solid #e8e4de;background:#ffffff;text-align:center;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <span style="font-size:13px;font-weight:600;letter-spacing:0.02em;color:#1a1a1a;">${escapeHtml(
              brandLine,
            )}</span>
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
            <strong style="color:#1a1a1a;">${escapeHtml(brandLine)}</strong><br />
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
