'use client'

import { useEffect, useRef } from 'react'
import { trackEvent, fireMetaEvent } from '@/lib/analytics'
import { createClient } from '@/lib/supabase/client'

export default function InsightsViewTracker({ insights }: { insights: any[] }) {
  const tracked = useRef(new Set<string>())

  useEffect(() => {
    // Fire Meta ViewContent for insights page once
    (async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        await fireMetaEvent('ViewContent', { content_type: 'page', content_name: 'insights' }, { email: user?.email || undefined, externalId: user?.id || undefined })
      } catch {}
    })()

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


