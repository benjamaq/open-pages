'use client'

import { useEffect, useState } from 'react'
import { TestingGrid } from '@/components/dashboard/TestingGrid'

export function TestingGridClient({ dayCount, initialSupplements = [] as any[] }: { dayCount: number; initialSupplements?: any[] }) {
  const [supplements, setSupplements] = useState<any[]>(Array.isArray(initialSupplements) ? initialSupplements : [])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSupplements = async () => {
      try {
        // debug logs per emergency checklist
        // eslint-disable-next-line no-console
        console.log('=== DASHBOARD FETCHING SUPPLEMENTS ===')
        const res = await fetch('/api/supplements', { cache: 'no-store' })
        // eslint-disable-next-line no-console
        console.log('Response status:', res.status)
        const data = await res.json().catch(() => [])
        // eslint-disable-next-line no-console
        console.log('Received data:', data)
        // eslint-disable-next-line no-console
        console.log('Count:', Array.isArray(data) ? data.length : 'n/a')
        if (Array.isArray(data)) setSupplements(data)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('fetch /api/supplements failed', e)
      } finally {
        setLoading(false)
      }
    }
    fetchSupplements()
  }, [])

  // debug before render
  // eslint-disable-next-line no-console
  console.log('=== RENDERING GRID ===')
  // eslint-disable-next-line no-console
  console.log('Supplements in state:', supplements)

  if (!loading && supplements.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700 flex items-center justify-between">
        <span>No supplements yet.</span>
        <a href="/dashboard?add=1" className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800">+ Add Your First Supplement</a>
      </div>
    )
  }

  return <TestingGrid supplements={supplements} daysCompleted={dayCount} />
}



