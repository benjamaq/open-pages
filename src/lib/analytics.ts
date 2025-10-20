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


