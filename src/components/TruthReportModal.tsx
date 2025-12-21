'use client'

import { useEffect, useState } from 'react'
import TruthReportView from './TruthReportView'

export type TruthReportModalProps = {
  isOpen: boolean
  onClose: () => void
  userSupplementId: string
}

export default function TruthReportModal({ isOpen, onClose, userSupplementId }: TruthReportModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!isOpen) return
    let mounted = true
    ;(async () => {
      try {
        setLoading(true); setError(null)
        const res = await fetch(`/api/truth-report/${encodeURIComponent(userSupplementId)}`, { cache: 'no-store', credentials: 'include' })
        const json = await res.json()
        if (!mounted) return
        if (!res.ok) throw new Error(json?.error || 'Failed')
        setData(json)
      } catch (e: any) {
        setError(e?.message || 'Failed to run analysis')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [isOpen, userSupplementId])

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <div className="absolute inset-0 overflow-auto">
        <button onClick={onClose} className="fixed top-4 right-4 text-slate-200 text-sm">Close</button>
        {loading && (
          <div className="min-h-screen grid place-items-center text-slate-200 text-sm">Running analysis…</div>
        )}
        {error && !loading && (
          <div className="min-h-screen grid place-items-center text-rose-300 text-sm">{error}</div>
        )}
        {data && !loading && <TruthReportView report={data} />}
      </div>
    </div>
  )
}




