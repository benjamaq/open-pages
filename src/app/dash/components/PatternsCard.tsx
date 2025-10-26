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
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900">Patterns & Insights</h3>
      </div>
      <div className="space-y-3">
        {insights.map((ins, idx) => (
          <PatternInsightCard key={ins.id} insight={ins} isNew={idx === 0} />
        ))}
      </div>
    </div>
  )
}

function PatternInsightCard({ insight, isNew }: { insight: Insight; isNew: boolean }) {
  const { topLine, action, icon, insight_key, type, priority, metrics } = insight.context || {}
  const title = insight.context?.title || topLine
  const actionable = insight.context?.actionable || action
  const evidenceLink = insight.context?.evidenceLink
  const insightKey = insight.context?.insightKey || insight_key

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <div className="text-xl leading-none">{icon || '🧠'}</div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{title}</div>
            {actionable ? (
              <div className="text-sm text-gray-700 mt-1">{actionable}</div>
            ) : null}
            <div className="text-xs text-gray-500 mt-1">{new Date(insight.created_at).toLocaleString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {evidenceLink ? (
            <a className="text-xs text-blue-600 hover:underline" href={evidenceLink}>Evidence</a>
          ) : null}
          {insightKey ? (
            <>
              <button
                className="text-xs text-gray-600 hover:text-gray-900"
                onClick={async () => {
                  await fetch('/api/insights/pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ insightKey }) })
                }}
              >Pin</button>
              <button
                className="text-xs text-gray-600 hover:text-gray-900"
                onClick={async () => {
                  await fetch('/api/insights/hide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ insightKey }) })
                }}
              >Hide</button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}


