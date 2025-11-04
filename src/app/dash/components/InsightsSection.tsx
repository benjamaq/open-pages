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

  // Show up to 5 insights, grouped by key, then strictly sorted by recency (most recent first)
  let sortedInsights = Array.from(byKey.values())
    .map(group => pickForKey(group))
    .sort((a, b) => (new Date(b.created_at || '').getTime()) - (new Date(a.created_at || '').getTime()))
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

  // Date formatting is inlined at call site to avoid any undefined helper references after minification

  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex items-center justify-between w-full">
        <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <span>🧠</span>
          <span>Patterns Discovered</span>
        </h4>
        <div className="flex items-center gap-3">
          <a
            href="/patterns"
            className="text-xs text-purple-700 hover:text-purple-900 leading-tight flex flex-col items-end sm:flex-row sm:items-center sm:gap-1"
            aria-label="View all insights"
          >
            <span>View All</span>
            <span className="sm:inline hidden">patterns</span>
            <span className="sm:hidden">Patterns</span>
          </a>
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
  const { type, topLine, discovery, action } = insight.context
  const cardType = (type === 'pattern' || type === 'observation' || type === 'milestone') ? type : 'pattern'
  const headerLabel = cardType === 'pattern' ? 'PATTERN DISCOVERED' : cardType === 'milestone' ? 'MILESTONE' : 'OBSERVATION'
  const ts = (() => {
    const iso = insight.created_at
    if (!iso) return ''
    try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) } catch { return '' }
  })()
  const dayLink = (() => {
    try {
      const iso = insight.created_at
      if (!iso) return '/dash'
      const d = new Date(iso)
      const y = d.getUTCFullYear()
      const m = String(d.getUTCMonth() + 1).padStart(2, '0')
      const da = String(d.getUTCDate()).padStart(2, '0')
      const dateStr = `${y}-${m}-${da}`
      return `/dash?date=${dateStr}#daily-summaries`
    } catch { return '/dash' }
  })()
  return (
    <div className="pattern-card" data-type={cardType}>
      <div className="card-header">{headerLabel}</div>
      {topLine && (<h3 className="card-title">{topLine}</h3>)}
      {discovery && (<p className="card-body">{discovery}</p>)}
      {cardType === 'pattern' && action && (
        <p className="card-body card-insight"><span className="card-insight-label">Insight:</span> {action}</p>
      )}
      {ts && (
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-gray-400">{ts}</div>
          <a href={dayLink} className="text-xs text-purple-700 hover:text-purple-900">View this day in your calendar →</a>
        </div>
      )}

      <style jsx>{`
        .pattern-card{ background:#fff; border:1px solid #E5E7EB; border-left:4px solid #7C3AED; border-radius:12px; padding:24px }
        .pattern-card[data-type="observation"]{ border-left-color:#9CA3AF }
        .pattern-card[data-type="milestone"]{ border-left-color:#F59E0B; background:rgba(251,191,36,0.05) }
        .card-header{ color:#7C3AED; font-size:13px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; display:flex; align-items:center; gap:8px; margin-bottom:12px }
        .pattern-card[data-type="observation"] .card-header{ color:#6B7280 }
        .pattern-card[data-type="milestone"] .card-header{ color:#F59E0B }
        .pattern-card[data-type="pattern"] .card-header:before{ content:"🧠"; font-size:18px }
        .pattern-card[data-type="observation"] .card-header:before{ content:"📊"; font-size:18px }
        .pattern-card[data-type="milestone"] .card-header:before{ content:"✨"; font-size:18px }
        .card-title{ font-size:20px; font-weight:700; color:#1F2937; margin:0 0 16px }
        .card-body{ font-size:16px; line-height:1.7; color:#374151 }
        .card-insight{ margin-top:16px; padding-top:16px; border-top:1px solid #E5E7EB }
        .card-insight-label{ font-weight:700; color:#1F2937; margin-right:4px }
      `}</style>
    </div>
  )
}


