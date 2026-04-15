/**
 * Derive First / Last for confirmed-participant shipping CSV.
 * DB: profiles use `display_name` (full name) and optional `first_name`; there is no `last_name` on profiles.
 * Auth: user_metadata may have first_name, last_name, full_name, or name.
 */

export function splitFullNameOnFirstSpace(fullName: string): { first: string; last: string } {
  const s = String(fullName || '').trim()
  if (!s) return { first: '', last: '' }
  const i = s.indexOf(' ')
  if (i === -1) return { first: s, last: '' }
  return { first: s.slice(0, i), last: s.slice(i + 1).trim() }
}

export function namesFromAuthAndProfileForShippingCsv(
  meta: Record<string, unknown> | null | undefined,
  displayName: string | null | undefined,
  profileFirstName: string | null | undefined,
): { first: string; last: string } {
  const m = meta || {}
  const metaFirst = typeof m.first_name === 'string' ? m.first_name.trim() : ''
  const metaLast = typeof m.last_name === 'string' ? m.last_name.trim() : ''

  if (metaFirst && metaLast) {
    return { first: metaFirst, last: metaLast }
  }

  const disp = displayName != null ? String(displayName).trim() : ''
  const metaFull = typeof m.full_name === 'string' ? m.full_name.trim() : ''
  const metaName = typeof m.name === 'string' ? m.name.trim() : ''
  const pf = profileFirstName != null ? String(profileFirstName).trim() : ''

  const combined = disp || metaFull || metaName || pf
  if (combined) {
    return splitFullNameOnFirstSpace(combined)
  }

  if (metaFirst || metaLast) {
    return { first: metaFirst, last: metaLast }
  }

  return { first: '', last: '' }
}
