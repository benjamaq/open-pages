/**
 * Comma-separated emails allowed to use /admin after Supabase sign-in.
 * When set in production, /admin/* (except /admin/login) requires a matching session.
 * When unset, legacy behavior: /admin/cohorts can load without login; other /admin routes * still use the bs_admin_key cookie gate in root middleware.
 */
export function adminPanelAllowlistConfigured(): boolean {
  return (process.env.ADMIN_PANEL_ALLOWED_EMAILS || '').trim().length > 0
}

export function parseAdminPanelAllowedEmails(): string[] {
  const raw = process.env.ADMIN_PANEL_ALLOWED_EMAILS || ''
  return raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
}

export function isAdminPanelEmail(email: string | undefined | null): boolean {
  const allowed = parseAdminPanelAllowedEmails()
  if (!email || allowed.length === 0) return false
  return allowed.includes(email.trim().toLowerCase())
}
