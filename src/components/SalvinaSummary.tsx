'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import EnhancedDayDrawerV2 from '@/app/components/mood/EnhancedDayDrawerV2'

export interface InsightItem {
  id: string
  text: string
  confidence: number
  confidenceSource?: string
  createdAt: string
}

export interface NextStepPayload {
  action: string
  description: string
  buttonLabel: string
  metadata?: any
}

export interface WinsPayload {
  hrvChangePct?: number | null
  moneySaved?: number | null
  percentile?: string | null
}

export default function SalvinaSummary({
  insights,
  nextStep,
  wins,
  updatedAt,
  onViewAll,
  onDoNext,
  requiresCheckIn
}: {
  insights: InsightItem[]
  nextStep: NextStepPayload | null
  wins: WinsPayload
  updatedAt: string
  onViewAll?: () => void
  onDoNext?: () => void
  requiresCheckIn?: boolean
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [showCheckin, setShowCheckin] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const max = 4
  const items = expanded ? insights : insights.slice(0, max)
  const more = Math.max(0, insights.length - max)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store', credentials: 'include' })
        if (!res.ok) return
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (data?.userId) setUserId(String(data.userId))
        if (data?.firstName) setUserName(String(data.firstName))
      } catch {}
    })()
    return () => { cancelled = true }
  }, [])

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Salvina&apos;s Summary</h2>
          <p className="text-xs text-gray-500">Updated {new Date(updatedAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Check-in needed (separate section) */}
      {requiresCheckIn && (
        <div className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50/40 rounded">
          <div className="text-sm text-slate-600 mb-2">
            📋 Daily check-in needed
          </div>
          <button
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md"
            onClick={() => setShowCheckin(true)}
          >
            Complete Today&apos;s Check-in
          </button>
        </div>
      )}

      {/* Insights */}
      <ul className="list-disc pl-5 space-y-2 mb-4">
        {items.map((i) => (
          <li key={i.id} className="text-sm text-gray-800">
            {i.text}
            {i.confidenceSource && (
              <span className="ml-2 text-xs text-gray-500">({i.confidenceSource})</span>
            )}
          </li>
        ))}
      </ul>
      {more > 0 && !expanded && (
        <div className="mb-4">
          <button className="text-sm text-gray-600 underline" onClick={() => setExpanded(true)}>
            View {more} more insights →
          </button>
          {onViewAll && (
            <button className="ml-3 text-sm text-blue-600 underline" onClick={onViewAll}>
              View all insights
            </button>
          )}
        </div>
      )}

      {/* Next Best Step (separate, and clearer actions) */}
      {nextStep && nextStep.action !== 'checkin' && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-4">
          <div className="text-sm font-medium mb-1">Next Best Step</div>
          <div className="text-sm text-gray-800">{nextStep.description}</div>
          <div className="mt-2">
            {nextStep.action === 'start_timing' ? (
              <button
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md"
                onClick={() => {
                  const supp = (nextStep as any)?.metadata?.supplementName || 'this supplement'
                  const confirmed = typeof window !== 'undefined' && window.confirm(
                    `Start timing test for ${supp}?\n\n- We'll test evening vs morning timing\n- Takes 7 days\n- You'll get results at the end`
                  )
                  if (confirmed) onDoNext?.()
                }}
              >
                🧪 Start Timing Test{(nextStep as any)?.metadata?.supplementName ? ` for ${(nextStep as any).metadata.supplementName}` : ''}
              </button>
            ) : nextStep.action === 'view_test' ? (
              <button
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md"
                onClick={onDoNext}
              >
                📊 View Test Progress
              </button>
            ) : (
              <button
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md"
                onClick={onDoNext}
              >
                {nextStep.buttonLabel || 'Do this'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Wins */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-gray-50 p-2 text-center">
          <div className="text-xs text-gray-500">HRV change</div>
          <div className="text-sm font-semibold">
            {wins.hrvChangePct != null ? `${wins.hrvChangePct.toFixed(1)}%` : '—'}
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-center">
          <div className="text-xs text-gray-500">Money saved</div>
          <div className="text-sm font-semibold">
            {wins.moneySaved != null ? `$${wins.moneySaved}` : '—'}
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-center">
          <div className="text-xs text-gray-500">Benchmark</div>
          <div className="text-sm font-semibold">
            {wins.percentile || '—'}
          </div>
        </div>
      </div>
      {/* Check-in Modal (new) */}
      {showCheckin && userId && (
        <EnhancedDayDrawerV2
          isOpen={true}
          onClose={() => {
            setShowCheckin(false)
            router.refresh()
          }}
          date={today}
          userId={userId}
          userName={userName}
        />
      )}
    </div>
  )
}


