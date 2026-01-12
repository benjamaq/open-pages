'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import TruthReportView from '@/components/TruthReportView'

export default function TruthReportClient() {
	const params = useParams() as { id?: string }
	const search = useSearchParams()
	const userSupplementId = params?.id || ''
	const force = search?.get('force') === 'true'

	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [data, setData] = useState<any>(null)

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
			} catch (e: any) {
				setError(e?.message || 'Failed to load report')
			} finally {
				if (mounted) setLoading(false)
			}
		})()
		return () => { mounted = false }
	}, [userSupplementId, force])

	if (loading) return <div className="min-h-screen bg-[#0B0D13] text-slate-200 grid place-items-center text-sm">Loading Truth Report…</div>
	if (error) return <div className="min-h-screen bg-[#0B0D13] text-rose-300 grid place-items-center text-sm">{error}</div>
	if (!data) return null
	return <TruthReportView report={data} />
}


