import { Suspense } from 'react'
import TruthReportClient from './TruthReportClient'

export default function TruthReportPage() {
	return (
		<Suspense fallback={<div className="min-h-screen bg-[#0B0D13] text-slate-200 grid place-items-center text-sm">Loading Truth Report…</div>}>
			<TruthReportClient />
		</Suspense>
	)
}
