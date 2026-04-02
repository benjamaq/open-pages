/**
 * Supabase magic-link failures often redirect with error in the URL hash or query string.
 * Hash is never sent to the server, so routes must handle this on the client.
 */
export function readMagicLinkAuthErrorFromLocation(href: string): boolean {
  try {
    const u = new URL(href)
    const hash = u.hash.replace(/^#/, '').trim()
    const hp = new URLSearchParams(hash.startsWith('/') ? hash.slice(1) : hash)
    const sp = u.searchParams
    const error = hp.get('error') ?? sp.get('error') ?? ''
    const code = hp.get('error_code') ?? sp.get('error_code') ?? ''
    return error === 'access_denied' || code === 'otp_expired'
  } catch {
    return false
  }
}

export function magicLinkAuthErrorFromWindow(): boolean {
  if (typeof window === 'undefined') return false
  return readMagicLinkAuthErrorFromLocation(window.location.href)
}

/** Remove Supabase error fragments/params so refresh does not show a broken state. */
export function stripMagicLinkAuthParamsFromUrl(): void {
  if (typeof window === 'undefined') return
  const u = new URL(window.location.href)
  u.hash = ''
  for (const k of ['error', 'error_code', 'error_description']) {
    u.searchParams.delete(k)
  }
  const q = u.searchParams.toString()
  window.history.replaceState(null, '', `${u.pathname}${q ? `?${q}` : ''}`)
}
