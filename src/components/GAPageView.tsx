'use client'

import { useEffect, Suspense } from 'react'
import { usePathname } from 'next/navigation'

const GA_ID = 'G-BQJWCVNJH0'

function GAPageViewInner() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname && typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'page_view', {
        page_path: pathname,
        page_title: document.title,
        page_location: window.location.href,
      })
    }
  }, [pathname])

  return null
}

export default function GAPageView() {
  return (
    <Suspense fallback={null}>
      <GAPageViewInner />
    </Suspense>
  )
}
