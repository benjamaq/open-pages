'use client'

import { useEffect, useState } from 'react'
import TruthReportView from './TruthReportView'

export type TruthReportModalProps = {
  isOpen: boolean
  onClose: () => void
  userSupplementId: string
  supplementName?: string
}

export default function TruthReportModal({ isOpen, onClose, userSupplementId, supplementName }: TruthReportModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [refreshNonce, setRefreshNonce] = useState(0)

  useEffect(() => {
    if (!isOpen) return
    let mounted = true
    ;(async () => {
      try {
        setLoading(true); setError(null)
        try { console.log('[report] Modal received ID:', userSupplementId) } catch {}
        // Default behavior: read the stored truth report. Only recompute when the user explicitly refreshes.
        const url = `/api/truth-report/${encodeURIComponent(userSupplementId)}${refreshNonce ? `?force=true&__bust=${Date.now()}` : ''}`
        try { console.log('[report] API called with ID:', userSupplementId, 'url:', url) } catch {}
        const res = await fetch(url, { cache: 'no-store', credentials: 'include' })
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
  }, [isOpen, userSupplementId, refreshNonce])

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <div className="absolute inset-0 overflow-auto">
        <div className="fixed top-4 right-4 flex items-center gap-3">
          <button
            onClick={() => setRefreshNonce(n => n + 1)}
            className="text-slate-200 text-sm underline underline-offset-4"
            title="Recompute this report now"
          >
            Refresh analysis
          </button>
          <button onClick={onClose} className="text-slate-200 text-sm">Close</button>
        </div>
        {loading && (
          <div className="min-h-screen grid place-items-center text-slate-200 text-sm">Running analysis…</div>
        )}
        {error && !loading && (
          <div className="min-h-screen grid place-items-center text-rose-300 text-sm">{error}</div>
        )}
        {data && !loading && (
          <>
            {(() => { try { console.log('[TruthReportModal] Rendering view with supplementName:', supplementName || null) } catch {} return null })()}
            <TruthReportView report={{ ...data, supplementName }} />
          </>
        )}
      </div>
    </div>
  )
}




