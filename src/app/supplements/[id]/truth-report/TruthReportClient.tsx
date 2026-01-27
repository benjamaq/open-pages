'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import TruthReportView from '@/components/TruthReportView'

export default function TruthReportClient() {
	const params = useParams() as { id?: string }
	const search = useSearchParams()
	const router = useRouter()
	const userSupplementId = params?.id || ''
	const force = search?.get('force') === 'true'
	const returnTo = search?.get('returnTo') || ''

	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [data, setData] = useState<any>(null)
  const [supplementName, setSupplementName] = useState<string>('')

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				setLoading(true); setError(null)
				const suffix = force ? '?force=true' : ''
				const url = `/api/truth-report/${encodeURIComponent(userSupplementId)}${suffix}`
				const res = await fetch(url, { cache: 'no-store', credentials: 'include' })
				const json = await res.json()
				if (!mounted) return
				if (!res.ok) throw new Error(json?.error || 'Failed')
				setData(json)
        // Try to resolve a human-friendly supplement name for the header
        try {
          const directName = String(
            json?.supplementName ||
            json?.name ||
            json?.label ||
            json?.supplement ||
            json?.meta?.supplementName ||
            ''
          ).trim()
          if (directName) {
            setSupplementName(directName)
          } else {
            const s = await fetch('/api/supplements', { cache: 'no-store' })
            if (s.ok) {
              const arr = await s.json()
              if (Array.isArray(arr)) {
                const lowerId = String(userSupplementId || '').toLowerCase()
                const hit = arr.find((x: any) => {
                  const a = String(x?.id || '').toLowerCase()
                  const b = String(x?.user_supplement_id || '').toLowerCase()
                  const c = String(x?.intake_id || '').toLowerCase()
                  return a === lowerId || b === lowerId || c === lowerId
                })
                const nm = String(hit?.name || hit?.label || '').trim()
                if (nm) setSupplementName(nm)
              }
            }
          }
        } catch {}
			} catch (e: any) {
				setError(e?.message || 'Failed to load report')
			} finally {
				if (mounted) setLoading(false)
			}
		})()
		return () => { mounted = false }
	}, [userSupplementId, force])

	const handleBack = () => {
		try {
			if (typeof window !== 'undefined' && window.history.length > 1) {
				router.back()
				return
			}
		} catch {}
		if (returnTo) {
			router.push(returnTo)
		} else {
			router.push('/dashboard')
		}
	}

	if (loading) return <div className="min-h-screen bg-[#0B0D13] text-slate-200 grid place-items-center text-sm">Loading Truth Report…</div>
	if (error) return <div className="min-h-screen bg-[#0B0D13] text-rose-300 grid place-items-center text-sm">{error}</div>
	if (!data) return null
	return (
		<div>
			<div className="absolute top-3 left-3 z-10">
				<button onClick={handleBack} className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-200 hover:bg-slate-800">
					← Back
				</button>
			</div>
			<TruthReportView report={{ ...data, supplementName }} />
		</div>
	)
}

