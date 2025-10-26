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

export function fireMetaEvent(eventName: string, params?: Record<string, any>) {
  try {
    const pixelId = (process as any).env?.NEXT_PUBLIC_META_PIXEL_ID || '704287959370274'
    let method: string[] = []
    const testCode = (process as any).env?.NEXT_PUBLIC_META_TEST_EVENT_CODE
    if (typeof window !== 'undefined' && (window as any).fbq) {
      try {
        const opts = testCode ? { eventID: testCode } : undefined
        ;(window as any).fbq('track', eventName, params || {}, opts)
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


