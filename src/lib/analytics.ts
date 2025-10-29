export function trackEvent(name: string, params?: Record<string, any>) {
  try {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', name, params || {})
    }
    if (typeof window !== 'undefined' && (window as any).fbq) {
      const metaEvents: Record<string, string> = {
        sign_up: 'CompleteRegistration',
        begin_checkout: 'InitiateCheckout',
        purchase: 'Purchase',
        view_content: 'ViewContent',
        lead: 'Lead',
      }
      const mapped = metaEvents[name]
      if (mapped) {
        ;(window as any).fbq('track', mapped, params || {})
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Analytics] trackEvent failed', e)
  }
}

export function attachAttributionToParams(params: Record<string, any>) {
  try {
    const ft = (() => { try { return document.cookie.match(/(?:^|; )bs_ft=([^;]+)/)?.[1] } catch { return undefined } })()
    const lt = (() => { try { return document.cookie.match(/(?:^|; )bs_lt=([^;]+)/)?.[1] } catch { return undefined } })()
    if (ft) params.first_touch = decodeURIComponent(ft)
    if (lt) params.last_touch = decodeURIComponent(lt)
  } catch {}
  return params
}

// Normalize helpers (per Meta requirements)
function normalizeEmail(value?: string | null): string | undefined {
  if (!value) return undefined
  return value.trim().toLowerCase()
}

function normalizeName(value?: string | null): string | undefined {
  if (!value) return undefined
  return value.trim().toLowerCase()
}

function normalizePhone(value?: string | null): string | undefined {
  if (!value) return undefined
  const digits = value.replace(/[^0-9]/g, '')
  if (!digits) return undefined
  return digits
}

function getCookie(name: string): string | undefined {
  try {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
    return m ? decodeURIComponent(m[1]) : undefined
  } catch {
    return undefined
  }
}

function getFbpFbc(): { fbp?: string; fbc?: string } {
  const fbp = getCookie('_fbp')
  const fbc = getCookie('_fbc')
  return { fbp, fbc }
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hex = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return hex
}

async function buildAdvancedMatching(identity?: {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  externalId?: string
  eventId?: string
}) {
  const anonUA = typeof navigator !== 'undefined' ? navigator.userAgent : undefined
  const { fbp, fbc } = typeof document !== 'undefined' ? getFbpFbc() : { fbp: undefined, fbc: undefined }

  const emNorm = normalizeEmail(identity?.email)
  const fnNorm = normalizeName(identity?.firstName)
  const lnNorm = normalizeName(identity?.lastName)
  const phNorm = normalizePhone(identity?.phone)

  const [emHash, fnHash, lnHash, phHash] = await Promise.all([
    emNorm ? sha256Hex(emNorm) : Promise.resolve(undefined),
    fnNorm ? sha256Hex(fnNorm) : Promise.resolve(undefined),
    lnNorm ? sha256Hex(lnNorm) : Promise.resolve(undefined),
    phNorm ? sha256Hex(phNorm) : Promise.resolve(undefined)
  ])

  const opts: Record<string, any> = {}
  if (identity?.eventId) opts.eventID = identity.eventId
  if (identity?.externalId) opts.external_id = identity.externalId
  if (emHash) opts.em = emHash
  if (phHash) opts.ph = phHash
  if (fnHash) opts.fn = fnHash
  if (lnHash) opts.ln = lnHash
  // Anonymous context (useful for diagnostics and parity with CAPI fields)
  if (fbp) opts.fbp = fbp
  if (fbc) opts.fbc = fbc
  if (anonUA) opts.client_user_agent = anonUA
  return opts
}

export async function fireMetaEvent(
  eventName: string,
  params?: Record<string, any>,
  identity?: { email?: string; phone?: string; firstName?: string; lastName?: string; externalId?: string; eventId?: string }
): Promise<string> {
  try {
    const pixelId = (process as any).env?.NEXT_PUBLIC_META_PIXEL_ID || '704287959370274'
    let method: string[] = []
    const testCode = (process as any).env?.NEXT_PUBLIC_META_TEST_EVENT_CODE

    const opts = await buildAdvancedMatching(identity)
    // Preserve existing test event code behavior on image beacon; keep eventID if provided
    if (!opts.eventID && identity?.eventId) {
      opts.eventID = identity.eventId
    }

    if (typeof window !== 'undefined' && (window as any).fbq) {
      try {
        ;(window as any).fbq('track', eventName, params || {}, Object.keys(opts).length ? opts : undefined)
        method.push('fbq')
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[Analytics] fbq track failed', e)
      }
    }
    // Also send image beacon directly (belt and suspenders)
    if (typeof window !== 'undefined') {
      const loc = window.location?.href || ''
      const ref = document.referrer || ''
      let url = `https://www.facebook.com/tr?id=${encodeURIComponent(pixelId)}&ev=${encodeURIComponent(eventName)}&dl=${encodeURIComponent(loc)}&rl=${encodeURIComponent(ref)}&if=false&ts=${Date.now()}`
      if (testCode) url += `&test_event_code=${encodeURIComponent(testCode)}`
      if (opts.external_id) url += `&external_id=${encodeURIComponent(opts.external_id)}`
      if (opts.em) url += `&ud[em]=${encodeURIComponent(opts.em)}`
      if (opts.ph) url += `&ud[ph]=${encodeURIComponent(opts.ph)}`
      if (opts.fn) url += `&ud[fn]=${encodeURIComponent(opts.fn)}`
      if (opts.ln) url += `&ud[ln]=${encodeURIComponent(opts.ln)}`
      if (opts.fbp) url += `&fbp=${encodeURIComponent(opts.fbp)}`
      if (opts.fbc) url += `&fbc=${encodeURIComponent(opts.fbc)}`
      if (opts.client_user_agent) url += `&ua=${encodeURIComponent(opts.client_user_agent)}`
      // Try sendBeacon first
      try {
        if (navigator.sendBeacon) {
          const ok = navigator.sendBeacon(url)
          if (ok) method.push('beacon')
        }
      } catch {}
      const img = new Image()
      img.onload = () => { console.log('✅ Meta Pixel IMG beacon loaded') }
      img.onerror = () => { console.warn('⚠️ Meta Pixel IMG beacon blocked or failed') }
      img.src = url
      method.push('img')
      // eslint-disable-next-line no-console
      console.log('✅ Meta Pixel IMG beacon url:', url)
    }
    return method.join('+') || 'none'
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Analytics] fireMetaEvent failed', e)
  }
  return 'none'
}

// Google Analytics event tracking helper
// DEPRECATED duplicate GA helper removed to avoid duplicate identifier

// Declare gtag type for TypeScript
declare global {
  interface Window {
    gtag?: (
      command: 'event',
      eventName: string,
      eventParams?: Record<string, any>
    ) => void
  }
}


