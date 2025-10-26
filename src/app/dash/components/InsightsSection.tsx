'use client'

import { useState, useEffect, useRef } from 'react'
import { trackEvent } from '@/lib/analytics'
import { formatDistanceToNowStrict } from 'date-fns'

interface Insight {
  id: string
  created_at?: string
  context: {
    type?: string
    topLine?: string
    discovery?: string
    action?: string
    icon?: string
    insight_key?: string
    priority?: number
  }
  is_primary?: boolean
}

export function InsightsSection({ insights }: { insights: Insight[] }) {
  const [isExpanded, setIsExpanded] = useState(true)
  // Note: Avoid early returns before hooks to keep hook order consistent

  // Only include last 7 days, then group by insight_key; pick latest clean item
  const byKey = new Map<string, Insight[]>()
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  ;[...insights]
    .filter(i => (i.created_at ? new Date(i.created_at) >= sevenDaysAgo : true))
    .filter(i => i.context?.topLine && i.context?.action)
    .sort((a, b) => (new Date(b.created_at || '').getTime()) - (new Date(a.created_at || '').getTime()))
    .forEach((i) => {
      const key = i.context.insight_key || 'unknown'
      if (!byKey.has(key)) byKey.set(key, [])
      byKey.get(key)!.push(i)
    })

  const pickForKey = (list: Insight[]): Insight => {
    const clean = list.find(i => !(i.context?.discovery || '').includes('null out of 10'))
    return clean || list[0]
  }

  // Show up to 5 insights, sorted by priority, then delta, then recency
  let sortedInsights = Array.from(byKey.values())
    .map(group => pickForKey(group))
    .sort((a, b) => {
      const ap = a.context?.priority ?? 99
      const bp = b.context?.priority ?? 99
      if (ap !== bp) return ap - bp
      const ad = Math.abs((a as any).context?.metrics?.delta || (a as any).context?.metrics?.sameDayDelta || 0)
      const bd = Math.abs((b as any).context?.metrics?.delta || (b as any).context?.metrics?.sameDayDelta || 0)
      if (ad !== bd) return bd - ad
      return (new Date(b.created_at || '').getTime()) - (new Date(a.created_at || '').getTime())
    })
    .slice(0, 5)

  const trackedInsights = useRef(new Set<string>())

  useEffect(() => {
    if (!sortedInsights || sortedInsights.length === 0) return
    sortedInsights.forEach((i) => {
      const insightId = (i as any).context?.insight_key || i.id
      if (!trackedInsights.current.has(insightId)) {
        trackedInsights.current.add(insightId)
        trackEvent('pattern_detected', {
          pattern_type: (i as any).context?.type || 'unknown',
          item_name: (i as any).context?.topLine || 'unknown',
          location: 'dashboard'
        })
      }
    })
  }, [sortedInsights])

  const formatFullDate = (iso?: string) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    } catch { return '' }
  }

  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex items-center justify-between w-full">
        <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <span>🔥</span>
          <span>Insights Discovered</span>
        </h4>
        <div className="flex items-center gap-3">
          <a href="/patterns" className="text-xs text-purple-700 hover:text-purple-900">View All</a>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? '▲ Hide' : '▼ Show'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {sortedInsights.length === 0 ? (
            <p className="text-xs text-gray-600">Track for 1-2 more days to discover your first insights.</p>
          ) : (
            sortedInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const { type, topLine, discovery, action, icon } = insight.context
  const ts = formatFullDate(insight.created_at)
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{icon || '💡'}</span>
        <div className="flex-1 min-w-0">
          {type && (
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{type}</div>
          )}
          {topLine && (
            <div className="font-bold text-gray-900 text-lg mb-2">{topLine}</div>
          )}
          {discovery ? (
            <p className="text-base text-gray-700 mb-2 leading-relaxed">{discovery}</p>
          ) : (
            <p className="text-sm text-gray-500 mb-2">(no discovery details provided)</p>
          )}
          {action && (
            <p className="text-base text-gray-900 font-semibold">{action}</p>
          )}
          {ts && (
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-gray-400">{ts}</div>
              <a
                href={`/dash#day-${(insight as any)?.context?.date || ''}`}
                className="text-xs text-purple-700 hover:text-purple-900"
              >
                View this day in your calendar →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


