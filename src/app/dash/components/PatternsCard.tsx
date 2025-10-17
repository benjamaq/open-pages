'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Insight {
  id: string
  created_at: string
  context: any
}

export function PatternsCard({ userId }: { userId: string }) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('elli_messages')
        .select('id, created_at, context')
        .eq('user_id', userId)
        .eq('message_type', 'insight')
        .order('created_at', { ascending: false })
        .limit(5)
      setInsights((data as any) || [])
    }
    load()
  }, [userId])

  if (!insights || insights.length === 0) return null
  return null
}

function PatternInsightCard({ insight, isNew }: { insight: Insight; isNew: boolean }) {
  const { title, action, icon, insight_key, type } = insight.context || {}

  const bgColor =
    type === 'Warning'
      ? 'bg-red-100 border-red-400'
      : type === 'Great news'
      ? 'bg-green-100 border-green-400'
      : insight_key === 'sleep_pain_correlation'
      ? 'bg-blue-100 border-blue-400'
      : 'bg-purple-100 border-purple-400'

  return null
}


