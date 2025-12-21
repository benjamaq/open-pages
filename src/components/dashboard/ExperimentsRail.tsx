'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import ExperimentMiniCard from './ExperimentMiniCard'
import ExperimentDrawer from './ExperimentDrawer'

type Experiment = {
  id: string
  name: string
  start_date: string
  end_date: string | null
  target_days: number
  effect_pct: number | null
  confidence: number | null
  supplement_id: string
}

export default function ExperimentsRail({
  userId,
  supplements,
  onRefresh,
  onStartExperiment
}: {
  userId?: string
  supplements: Array<{ id: string; name: string }>
  onRefresh?: () => void
  onStartExperiment?: (supplementId: string) => void
}) {
  const [open, setOpen] = useState(true)
  const [items, setItems] = useState<Experiment[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [selectedSupplementId, setSelectedSupplementId] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  async function fetchActive() {
    try {
      const res = await fetch('/api/experiments?status=active', {
        headers: userId ? { 'x-user-id': userId } : undefined
      })
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
      return Array.isArray(data) ? data : []
    } catch {}
  }
  useEffect(() => {
    fetchActive()
  }, [])

  const active = items.filter(e => e.end_date == null)
  const calcDay = (start: string) =>
    Math.max(1, Math.ceil((Date.now() - new Date(start).getTime()) / 86400000))

  async function startTest(supplementId: string, targetDays: number = 7) {
    try {
      setBusy(true)
      await fetch('/api/experiments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'x-user-id': userId } : {})
        },
        body: JSON.stringify({ supplement_id: supplementId, target_days: targetDays })
      })
      setBusy(false)
      await fetchActive()
      setOpen(true)
    } catch {
      setBusy(false)
    }
  }

  async function handleStartTest() {
    console.log('🧪 START TEST CLICKED', { selectedSupplementId })
    if (!selectedSupplementId) {
      console.log('❌ No supplement selected')
      return
    }
    console.log('🔄 Starting experiment...')
    setIsStarting(true)
    try {
      if (onStartExperiment) {
        onStartExperiment(selectedSupplementId)
        console.log('🔁 Delegated to parent modal for start')
      } else {
        console.log('📡 POST /api/experiments', { supplementId: selectedSupplementId })
        await startTest(selectedSupplementId, 7)
        console.log('✅ Test started successfully')
        setSelectedSupplementId(null)
        // Force immediate refresh
        const refreshed = await fetchActive()
        console.log('🔄 Refreshed active list:', (refreshed || []).length)
        onRefresh?.()
      }
    } catch (e) {
      console.error('❌ Start test failed:', e)
      alert('Failed to start test. See console.')
    } finally {
      setIsStarting(false)
    }
  }

  async function pauseTest(id: string) {
    try {
      console.log('⏸️ PAUSE TEST CLICKED', { id })
      setBusy(true)
      await fetch(`/api/experiments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'x-user-id': userId } : {})
        },
        body: JSON.stringify({})
      })
      console.log('✅ Pause call completed')
      setBusy(false)
      await fetchActive()
    } catch {
      setBusy(false)
    }
  }

  async function endTest(id: string) {
    try {
      console.log('🛑 END TEST CLICKED', { id })
      setBusy(true)
      await fetch(`/api/experiments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'x-user-id': userId } : {})
        },
        body: JSON.stringify({ end_date: new Date().toISOString().slice(0, 10) })
      })
      console.log('✅ End call completed')
      setBusy(false)
      await fetchActive()
    } catch {
      setBusy(false)
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 mt-6" data-testid="experiments-rail">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Experiments</h3>
            <span className="text-xs text-neutral-500">
              {active.length ? `${active.length} active` : 'No active tests'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dash/insights"
              className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
            >
              📊 Insights
            </Link>
            <button
              onClick={() => setOpen(o => !o)}
              className="rounded-xl bg-neutral-900 text-white px-3 py-2 text-sm hover:bg-neutral-800 flex items-center gap-1"
              aria-expanded={open}
            >
              <span>Experiments</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : 'rotate-0'}`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className={`transition-all duration-300 ${open ? 'mt-4' : 'mt-0'}`}>
          {open && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <div className="rounded-xl border p-4">
                <div className="text-sm font-medium mb-2">Start a new test</div>
                {/* Start new test section */}
                {/* Supplement selector */}
                <select
                  value={selectedSupplementId || ''}
                  onChange={e => setSelectedSupplementId(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="" disabled>
                    Select supplement...
                  </option>
                  {supplements.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {/* Start button - only show when supplement selected */}
                {selectedSupplementId && (
                  <button
                    onClick={handleStartTest}
                    disabled={isStarting}
                    className="mt-2 w-full rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isStarting ? 'Starting...' : 'Start 7-Day Test →'}
                  </button>
                )}
                <div className="mt-2 text-xs text-neutral-500">Default = 7 days. Edit duration after creation.</div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">
                  Active Tests {active.length > 0 ? `(${active.length})` : ''}
                </div>
              </div>
              {active.length === 0 ? (
                <div className="rounded-xl border p-4 text-sm text-neutral-600">No active tests. Start one above.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {active.slice(0, 6).map(exp => (
                    <ExperimentMiniCard
                      key={exp.id}
                      id={exp.id}
                      name={exp.name || '7-day test'}
                      day={calcDay(exp.start_date)}
                      targetDays={exp.target_days}
                      effectPct={exp.effect_pct ?? null}
                      confidence={exp.confidence ?? null}
                      onOpen={() => setSelectedId(exp.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          )}
        </div>
        <ExperimentDrawer
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
          experiment={items.find(e => e.id === selectedId) || null}
          onPause={pauseTest}
          onEnd={endTest}
        />
      </div>
    </section>
  )
}


