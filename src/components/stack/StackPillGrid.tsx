'use client'

import React, { useMemo, useState } from 'react'

export type PillItem = {
	id: string
	name: string
	category: string
	status: 'Testing' | 'Working' | 'Not working' | 'No clear effect' | 'Archived'
	monthly: number | null
	details?: {
		onAvg?: number | null
		offAvg?: number | null
		daysOn?: number | null
		daysOff?: number | null
		reqOn?: number | null
		reqOff?: number | null
		confidenceText?: string | null
		effectText?: string | null
	}
}

type Props = {
	items: PillItem[]
	fmtMoney: (n?: number | null) => string
	title?: string
	muted?: boolean
	enableFilters?: boolean
}

const STATUS_COLOR: Record<PillItem['status'], { bg: string; bgDark: string }> = {
	Testing: { bg: '#C65A2E', bgDark: '#9E4926' },
	Working: { bg: '#22C55E', bgDark: '#16A34A' },
	'Not working': { bg: '#EF4444', bgDark: '#B91C1C' },
	'No clear effect': { bg: '#6B7280', bgDark: '#4B5563' },
	Archived: { bg: '#9CA3AF', bgDark: '#6B7280' }
}

export default function StackPillGrid({ items, fmtMoney, title, muted = false, enableFilters = true }: Props) {
	const [expanded, setExpanded] = useState<Record<string, boolean>>({})
	const [cat, setCat] = useState<string>('All')
	const categories = useMemo(() => ['All', ...Array.from(new Set(items.map(i => i.category)))], [items])
	const filtered = useMemo(() => (cat === 'All' ? items : items.filter(i => i.category === cat)), [items, cat])
	return (
		<div>
			{title && <div className="text-xs font-semibold text-[#6B7280] uppercase mb-2">{title}</div>}
			{enableFilters && categories.length > 1 && (
				<div className="mb-3 flex flex-wrap gap-2">
					{categories.map(c => (
						<button key={c} onClick={() => setCat(c)} className={`text-xs px-3 py-1.5 rounded-full border ${cat === c ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#111111] border-[#E4E1DC]'}`}>
							{c}
						</button>
					))}
				</div>
			)}
			<div className="pill-grid">
				{filtered.map(it => {
					const isOpen = !!expanded[it.id]
					const col = STATUS_COLOR[it.status]
					const opacity = muted ? 0.7 : 1
					return (
						<div key={it.id} className="pill" style={{ opacity }}>
							<div className="pill-left" style={{ background: col.bg }}>{it.status}</div>
							<div className="pill-right">
								<div className="min-w-0">
									<div className="pill-name line-clamp-2">{it.name}</div>
									<div className="pill-metrics">
										{it.status === 'Working' && (it.details?.effectText ? it.details.effectText.replace('Clear positive effect: ', '+') : 'Positive signal')}
										{it.status === 'Not working' && 'Negative signal'}
										{it.status === 'No clear effect' && 'No measurable change'}
										{it.status === 'Testing' && (typeof it.details?.daysOn === 'number' || typeof it.details?.daysOff === 'number')
											? `ON ${it.details?.daysOn ?? 0}/${it.details?.reqOn ?? 0} • OFF ${it.details?.daysOff ?? 0}/${it.details?.reqOff ?? 0}`
											: ''}
									</div>
								</div>
								<div className="pill-footer">
									<div className="pill-cost">{fmtMoney(it.monthly)}</div>
									<button onClick={() => setExpanded(e => ({ ...e, [it.id]: !isOpen }))} className="pill-view">{isOpen ? 'Hide ›' : 'View ›'}</button>
								</div>
								{isOpen && (
									<div className="mt-3 text-xs text-[#4B5563]">
										<div className="border-t border-dashed mb-3" style={{ borderColor: '#E5E1DC' }} />
										{it.status === 'Testing' ? (
											<>
												<div className="font-semibold text-[#6B7280] uppercase mb-1">Progress Evidence</div>
												<div>Clean ON: {it.details?.daysOn ?? 0} • Clean OFF: {it.details?.daysOff ?? 0}</div>
												{(typeof it.details?.onAvg === 'number' || typeof it.details?.offAvg === 'number')
													? <div className="mt-1">ON avg {it.details?.onAvg?.toFixed(1) ?? '—'} • OFF avg {it.details?.offAvg?.toFixed(1) ?? '—'}</div>
													: <div className="mt-1">Not enough clean days yet to compare ON vs OFF.</div>}
												<div className="mt-2">
													<button className="px-3 py-1.5 rounded border border-[#E4E1DC] hover:bg-[#FAFAF9]" onClick={() => alert('Stop Testing (stub)')}>Stop Testing</button>
												</div>
											</>
										) : (
											<>
												<div className="font-semibold text-[#6B7280] uppercase mb-1">Evidence Summary</div>
												{(typeof it.details?.onAvg === 'number' || typeof it.details?.offAvg === 'number')
													? <div>ON avg {it.details?.onAvg?.toFixed(1) ?? '—'} • OFF avg {it.details?.offAvg?.toFixed(1) ?? '—'}</div>
													: <div>ON/OFF averages not available yet.</div>}
												{(it.details?.confidenceText || it.details?.effectText) && (
													<div className="mt-1">{it.details?.effectText}{it.details?.confidenceText ? (it.details?.effectText ? ' • ' : '') + it.details?.confidenceText : ''}</div>
												)}
												<div className="mt-2 flex flex-wrap gap-2">
													{it.status === 'Working' && <button className="px-3 py-1.5 rounded border border-[#E4E1DC] hover:bg-[#FAFAF9]" onClick={() => alert('Archive (stub)')}>Archive</button>}
													{it.status === 'Not working' && (
														<>
															<button className="px-3 py-1.5 rounded border border-[#E4E1DC] hover:bg-[#FAFAF9]" onClick={() => alert('Stop Taking (stub)')}>Stop Taking</button>
															<button className="px-3 py-1.5 rounded border border-[#E4E1DC] hover:bg-[#FAFAF9]" onClick={() => alert('Retest (stub)')}>Retest</button>
														</>
													)}
													{it.status === 'No clear effect' && (
														<>
															<button className="px-3 py-1.5 rounded border border-[#E4E1DC] hover:bg-[#FAFAF9]" onClick={() => alert('Keep Anyway (stub)')}>Keep Anyway</button>
															<button className="px-3 py-1.5 rounded border border-[#E4E1DC] hover:bg-[#FAFAF9]" onClick={() => alert('Stop (stub)')}>Stop</button>
														</>
													)}
												</div>
											</>
										)}
									</div>
								)}
							</div>
						</div>
					)
				})}
			</div>
			<style jsx>{`
				.pill-grid {
					display: grid;
					grid-template-columns: repeat(3, 1fr);
					gap: 16px;
				}
				@media (max-width: 1024px) {
					.pill-grid { grid-template-columns: repeat(2, 1fr); }
				}
				@media (max-width: 768px) {
					.pill-grid { grid-template-columns: 1fr; }
				}
				.pill {
					display: flex;
					flex-direction: row;
					border-radius: 100px;
					overflow: hidden;
					box-shadow: 0 4px 16px rgba(0,0,0,0.12);
					background: white;
					height: 100px;
					transition: transform 0.2s ease, box-shadow 0.2s ease;
				}
				.pill:hover {
					transform: translateY(-2px);
					box-shadow: 0 4px 12px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.16);
				}
				.pill-left {
					width: 30%;
					min-width: 100px;
					color: white;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 20px;
					font-size: 12px;
					font-weight: 700;
					text-transform: uppercase;
					letter-spacing: 1px;
				}
				.pill-right {
					width: 70%;
					padding: 16px 24px;
					display: flex;
					flex-direction: column;
					justify-content: center;
				}
				.pill-name {
					font-size: 16px;
					font-weight: 600;
					color: #1f2937;
					margin-bottom: 4px;
				}
				.pill-metrics {
					font-size: 13px;
					color: #6b7280;
					margin-bottom: 8px;
				}
				.pill-footer {
					display: flex;
					justify-content: space-between;
					align-items: center;
				}
				.pill-cost {
					font-size: 14px;
					font-weight: 500;
					color: #374151;
				}
				.pill-view {
					font-size: 13px;
					color: #6b7280;
					background: none;
					border: none;
					cursor: pointer;
				}
			`}</style>
		</div>
	)
}


