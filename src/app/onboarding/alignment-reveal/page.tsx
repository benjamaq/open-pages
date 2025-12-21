'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GoalCategory } from '@/types/insights'

export default function AlignmentRevealPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<{
    userGoals: GoalCategory[]
    stackGoals: Array<{ category: GoalCategory; percentage: number }>
    alignmentScore: number
    alignmentState: 'aligned' | 'mixed' | 'misaligned'
  } | null>(null)
  const [localGoals, setLocalGoals] = useState<GoalCategory[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/elli/alignment', { cache: 'no-store', credentials: 'include' })
        const json = await res.json()
        if (!mounted) return
        if (!res.ok) throw new Error(json?.error || 'Failed')
        setState(json)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'Failed to load alignment')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Fallback to local goals if server has none
  useEffect(() => {
    if (state?.userGoals && state.userGoals.length > 0) return
    try {
      const raw = localStorage.getItem('biostackr_user_goals_v1')
      if (raw) {
        const arr = JSON.parse(raw) as string[]
        setLocalGoals(arr as GoalCategory[])
      }
    } catch {}
  }, [state])

  const headline = state?.alignmentState === 'aligned'
    ? 'Good news — your goals align with your stack.'
    : state?.alignmentState === 'misaligned'
      ? 'Interesting — your goals and your stack don’t fully match.'
      : 'Some overlap — and some surprises.'

  const sub = state?.alignmentState === 'aligned'
    ? 'Now let’s start proving what actually works for your body.'
    : state?.alignmentState === 'misaligned'
      ? 'I’ll help you realign your stack and test what’s worth keeping.'
      : 'I’ll help you sort this out.'

  return (
    <main className="min-h-screen bg-gray-50 grid place-items-center px-4">
      <div className="w-full max-w-2xl rounded-xl border bg-white shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-indigo-600 text-white grid place-items-center font-semibold">E</div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold mb-1">Goal Alignment Reveal</h1>
            {loading && <p className="text-sm text-gray-600">Checking alignment…</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {state && (
              <>
                <p className="text-sm text-gray-800 mb-1">{headline}</p>
                <p className="text-sm text-gray-600 mb-3">{sub}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Card title="Your goals">
                    <div className="flex flex-wrap gap-2">
                      {(state.userGoals?.length ? state.userGoals : localGoals).map((g) => (
                        <span key={g} className="px-2 py-1 rounded-full text-xs bg-gray-100 capitalize">{g}</span>
                      ))}
                    </div>
                  </Card>
                  <Card title="Your stack focuses on">
                    <ul className="text-sm text-gray-700 space-y-1">
                      {(state.stackGoals || []).slice(0,3).map((g) => (
                        <li key={g.category} className="capitalize">{g.category} — {g.percentage}%</li>
                      ))}
                    </ul>
                  </Card>
                </div>
                <p className="text-xs text-gray-500 mt-3">This view is based on your current active supplements and their monthly spend.</p>
              </>
            )}
            <div className="mt-4">
              <button onClick={() => router.push('/dashboard')} className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm">Continue to My Dashboard</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-gray-500 mb-1">{title}</div>
      {children}
    </div>
  )
}


