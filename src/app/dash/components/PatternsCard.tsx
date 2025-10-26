'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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

  return <InsightsSection insights={insights} />
}

// Detailed card UI now handled by InsightsSection


