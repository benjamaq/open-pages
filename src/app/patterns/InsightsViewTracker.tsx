'use client'

import { useEffect, useRef } from 'react'
import { trackEvent } from '@/lib/analytics'

export default function InsightsViewTracker({ insights }: { insights: any[] }) {
  const tracked = useRef(new Set<string>())

  useEffect(() => {
    if (!insights || insights.length === 0) return
    insights.forEach((p) => {
      const id = p?.context?.insight_key || p?.id
      if (!id) return
      if (!tracked.current.has(id)) {
        tracked.current.add(id)
        trackEvent('pattern_detected', {
          pattern_type: p?.context?.type || 'unknown',
          item_name: p?.context?.topLine || 'unknown',
          location: 'insights_page',
          confidence: p?.context?.metrics?.confidence || 'unknown'
        })
      }
    })
  }, [insights])

  return null
}


