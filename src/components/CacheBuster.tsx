'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface CacheBusterProps {
  enabled?: boolean
}

export default function CacheBuster({ enabled = true }: CacheBusterProps) {
  const router = useRouter()

  useEffect(() => {
    if (!enabled) return

    // Force a refresh every 30 seconds to ensure fresh data
    const interval = setInterval(() => {
      // Only refresh if we're on the dashboard or settings page
      if (window.location.pathname.includes('/dash')) {
        router.refresh()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [enabled, router])

  return null // This component doesn't render anything
}

