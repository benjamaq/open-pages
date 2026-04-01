/** Cookie name for /admin route gate (must match middleware). */
export const ADMIN_KEY_COOKIE = 'bs_admin_key'

/** Mirrors admin key into a Path=/ cookie so middleware can gate /admin/*. */
export function persistAdminKeyToCookie(value: string) {
  const v = String(value || '').trim()
  if (!v || typeof document === 'undefined') return
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${ADMIN_KEY_COOKIE}=${encodeURIComponent(v)}; Path=/; Max-Age=2592000; SameSite=Lax${secure}`
  } catch {
    /* ignore */
  }
}
