'use client'

import { useEffect, useState } from 'react'
import SupplementsGrid from './SupplementsGrid'

export default function SupplementsGridClient({ initial }: { initial?: any[] }) {
	const [supplements, setSupplements] = useState<any[]>(Array.isArray(initial) ? initial : [])
	const [loading, setLoading] = useState<boolean>(!Array.isArray(initial))

	useEffect(() => {
		let cancelled = false
		;(async () => {
			try {
				const res = await fetch('/api/supplements', { cache: 'no-store' })
				const data = await res.json().catch(() => [])
				if (!cancelled && Array.isArray(data)) {
					setSupplements(data)
				}
			} catch {
				// ignore and keep whatever we have
			} finally {
				if (!cancelled) setLoading(false)
			}
		})()
		return () => { cancelled = true }
	}, [])

	if (!loading && supplements.length === 0) {
		return (
			<section className="bg-white border border-gray-200 rounded-lg p-6">
				<div className="text-center">
					<h3 className="text-lg font-semibold text-gray-900 mb-1">No supplements yet</h3>
					<p className="text-sm text-gray-600">Add your first supplement to start building signal.</p>
					<a
						href="/dashboard?add=1"
						className="mt-4 inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
					>
						+ Add Your First Supplement
					</a>
				</div>
			</section>
		)
	}

	return (
		<SupplementsGrid
			supplements={supplements}
			onAddClick={() => { try { window.location.href = '/dashboard?add=1' } catch {} }}
			onViewTimeline={() => {}}
			onEdit={() => {}}
			onArchive={() => {}}
		/>
	)
}


