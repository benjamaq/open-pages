/** `next` after /auth/callback: path+query decoded from the outer URL query string. */
export function decodeNextSearchParam(raw: string | null): string {
  const def = '/dash'
  if (raw == null || raw === '') return def
  try {
    let s = raw
    if (/%[0-9A-Fa-f]{2}/.test(s)) {
      try {
        s = decodeURIComponent(s)
      } catch {
        /* keep s */
      }
    }
    if (!s.startsWith('/')) return def
    return s
  } catch {
    return def
  }
}
