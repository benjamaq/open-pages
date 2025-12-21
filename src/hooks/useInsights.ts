'use client'

import { useEffect, useState } from 'react'
import type { InsightsSummary } from '@/types/insights'

export function useInsights() {
  const [insights, setInsights] = useState<InsightsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setIsLoading(true)
        setIsError(false)
        const res = await fetch('/api/insights', { cache: 'no-store', credentials: 'include' })
        if (!res.ok) throw new Error(await res.text())
        const data = (await res.json()) as InsightsSummary
        if (mounted) setInsights(data)
      } catch {
        if (mounted) setIsError(true)
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  return { insights, isLoading, isError }
}





