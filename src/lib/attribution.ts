export type Attribution = {
  source?: string
  medium?: string
  campaign?: string
  term?: string
  content?: string
  gclid?: string
  fbclid?: string
  referrer?: string
  landingPath?: string
  timestamp: string
}

export function parseAttributionFromLocation(loc: Location, doc: Document): Attribution {
  const p = new URLSearchParams(loc.search || '')
  const get = (k: string) => (p.get(k) || undefined) as string | undefined
  const attrib: Attribution = {
    source: get('utm_source') || undefined,
    medium: get('utm_medium') || undefined,
    campaign: get('utm_campaign') || undefined,
    term: get('utm_term') || undefined,
    content: get('utm_content') || undefined,
    gclid: get('gclid') || undefined,
    fbclid: get('fbclid') || undefined,
    referrer: doc.referrer || undefined,
    landingPath: loc.pathname,
    timestamp: new Date().toISOString(),
  }
  return attrib
}

function getCookie(name: string): string | null {
  try {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

export function captureAttributionClient() {
  try {
    if (typeof window === 'undefined') return
    const attrib = parseAttributionFromLocation(window.location, document)
    const hasUtm = attrib.source || attrib.medium || attrib.campaign || attrib.gclid || attrib.fbclid
    const existingFirst = getCookie('bs_ft')
    if (!existingFirst && hasUtm) {
      setCookie('bs_ft', JSON.stringify(attrib), 180)
    }
    if (hasUtm) {
      setCookie('bs_lt', JSON.stringify(attrib), 30)
    } else if (!getCookie('bs_ft')) {
      // Capture referrer-only first touch if no UTM and no first-touch yet
      const refOnly: Attribution = { referrer: attrib.referrer, landingPath: attrib.landingPath, timestamp: attrib.timestamp }
      setCookie('bs_ft', JSON.stringify(refOnly), 180)
      setCookie('bs_lt', JSON.stringify(refOnly), 30)
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Attribution] capture failed:', e)
  }
}

export function readAttributionCookies(): { first?: Attribution; last?: Attribution } {
  try {
    const ft = getCookie('bs_ft')
    const lt = getCookie('bs_lt')
    return {
      first: ft ? (JSON.parse(ft) as Attribution) : undefined,
      last: lt ? (JSON.parse(lt) as Attribution) : undefined,
    }
  } catch {
    return {}
  }
}
