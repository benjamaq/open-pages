'use client'

import { useEffect, useState } from 'react'
import { InsightsSection } from './InsightsSection'

interface Insight {
  id: string
  created_at: string
  context: any
}

export function PatternsCard({ userId }: { userId: string }) {
  const [insights, setInsights] = useState<Insight[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/insights?limit=10', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        setInsights(json.insights || [])
      } catch {}
    }
    load()
  }, [userId])

  return <InsightsSection insights={insights} />
}

// Detailed card UI now handled by InsightsSection


