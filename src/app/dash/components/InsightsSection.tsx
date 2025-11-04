'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
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
          <button
            type="button"
            onClick={() => router.push('/patterns')}
            className="bg-purple-600 text-white text-xs font-semibold px-3 py-2 rounded-md shadow-sm hover:bg-purple-700 transition-colors"
            aria-label="View all patterns"
          >
            View all patterns
          </button>
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

  // Determine card type if not explicitly set
  const determineCardType = (): 'pattern' | 'observation' | 'milestone' | 'warning' => {
    const t = (topLine || '').toLowerCase()
    const d = (discovery || '').toLowerCase()

    // Exact title-driven checks from brief
    if (t.includes('breakthrough')) return 'milestone'
    if (t.includes('climbing')) return 'warning'
    if (t.includes('linked to') || t.includes('appears to')) return 'pattern'

    // WARNING (negative trend / alert)
    const warningIndicators = [
      'climbing', 'increasing', 'getting worse', 'declined', 'declining', 'warning', 'concerning', 'worsening', 'dropped significantly'
    ]
    if (warningIndicators.some(k => t.includes(k) || d.includes(k))) return 'warning'

    // PATTERN (correlation between two variables)
    const patternIndicators = [
      'affect', 'linked to', 'correlated with', 'appears to', ' vs ', 'when your', 'with ', 'without '
    ]
    if (patternIndicators.some(k => t.includes(k) || d.includes(k))) return 'pattern'

    // MILESTONE (achievement)
    const milestoneIndicators = [
      'breakthrough', 'best', 'worst', 'lowest', 'highest', 'first time'
    ]
    if (milestoneIndicators.some(k => t.includes(k) || d.includes(k))) return 'milestone'

    // Default OBSERVATION
    return 'observation'
  }

  const resolvedType = (type === 'pattern' || type === 'observation' || type === 'milestone' || type === 'warning')
    ? type
    : determineCardType()
  const headerLabel = resolvedType === 'pattern' ? 'PATTERN DISCOVERED' : resolvedType === 'milestone' ? 'MILESTONE' : resolvedType === 'warning' ? 'WARNING' : 'OBSERVATION'
  try { if (process.env.NODE_ENV !== 'production') { console.log('[Card]', { title: topLine, resolvedType }) } } catch {}
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
    <div className="pattern-card" data-type={resolvedType}>
      <div className="card-header">{headerLabel}</div>
      {topLine && (<h3 className="card-title">{topLine}</h3>)}
      {discovery && (<p className="card-body">{discovery}</p>)}
      {resolvedType === 'pattern' && action && (
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
        .pattern-card[data-type="warning"]{ border-left-color:#DC2626; background:rgba(220,38,38,0.05) }
        .card-header{ color:#7C3AED; font-size:13px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; display:flex; align-items:center; gap:8px; margin-bottom:12px }
        .pattern-card[data-type="observation"] .card-header{ color:#6B7280 }
        .pattern-card[data-type="milestone"] .card-header{ color:#F59E0B }
        .pattern-card[data-type="warning"] .card-header{ color:#DC2626 }
        .pattern-card[data-type="pattern"] .card-header:before{ content:"🧠"; font-size:18px }
        .pattern-card[data-type="observation"] .card-header:before{ content:"📊"; font-size:18px }
        .pattern-card[data-type="milestone"] .card-header:before{ content:"✨"; font-size:18px }
        .pattern-card[data-type="warning"] .card-header:before{ content:"🚨"; font-size:18px }
        .card-title{ font-size:20px; font-weight:700; color:#1F2937; margin:0 0 16px }
        .card-body{ font-size:16px; line-height:1.7; color:#374151 }
        .card-insight{ margin-top:16px; padding-top:16px; border-top:1px solid #E5E7EB }
        .card-insight-label{ font-weight:700; color:#1F2937; margin-right:4px }
      `}</style>
    </div>
  )
}


