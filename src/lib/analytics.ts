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

// Google Analytics event tracking helper
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  // Avoid tracking in development and non-browser environments
  if (process.env.NODE_ENV !== 'production') return
  if (typeof window === 'undefined') return
  if (!window.gtag) return

  try {
    window.gtag('event', eventName, eventParams)
  } catch {
    // noop
  }
}

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


