'use client'

import React, { useState } from 'react'

export type LedgerRow = {
	id: string
	name: string
	lifecycle: 'Active' | 'Working' | 'Not working' | 'No clear effect' | 'Archived'
	monthly: number | null
	confidenceText?: string | null
	effectText?: string | null
	onAvg?: number | null
	offAvg?: number | null
	daysOn?: number | null
	daysOff?: number | null
	reqOn?: number | null
	reqOff?: number | null
}

type Props = {
	rows: LedgerRow[]
	fmtMoney: (n?: number | null) => string
}

export default function StackLedgerView({ rows, fmtMoney }: Props) {
	const [expanded, setExpanded] = useState<Record<string, boolean>>({})
	const groups: Array<LedgerRow['lifecycle']> = ['Working', 'Not working', 'No clear effect', 'Active']
	return (
		<div className="rounded-xl border border-[#E4E1DC] bg-white divide-y divide-[#EFEDE9]">
			{groups.map(g => {
				const list = rows.filter(r => r.lifecycle === g)
				if (list.length === 0) return null
				return (
					<div key={g} className="p-3">
						<div className="text-xs font-semibold text-[#6B7280] uppercase mb-2">{g}</div>
						<div className="space-y-2">
							{list.map(r => {
								const open = expanded[r.id]
								return (
									<div key={r.id} className="rounded-lg border border-[#E4E1DC] bg-[#FAFAF9]">
										<div className="p-3 flex items-center justify-between gap-3">
											<div className="min-w-0">
												<div className="text-[15px] font-medium text-[#111111] truncate">{r.name}</div>
												<div className="mt-0.5 text-xs text-[#4B5563]">
													{g === 'Active'
														? `ON ${r.daysOn ?? 0}/${r.reqOn ?? 0} • OFF ${r.daysOff ?? 0}/${r.reqOff ?? 0}`
														: r.effectText || 'No clear effect'}{r.confidenceText ? ` • ${r.confidenceText}` : ''}
												</div>
											</div>
											<div className="shrink-0 flex items-center gap-3">
												<div className="text-sm text-[#111111]">{fmtMoney(r.monthly)}</div>
												<button onClick={() => setExpanded(e => ({ ...e, [r.id]: !open }))} className="text-xs text-[#111111] underline">{open ? 'Hide' : 'View'}</button>
											</div>
										</div>
										{open && (
											<div className="px-3 pb-3 text-xs text-[#4B5563]">
												{(typeof r.onAvg === 'number' || typeof r.offAvg === 'number') ? (
													<div>ON avg {r.onAvg?.toFixed(1) ?? '—'} • OFF avg {r.offAvg?.toFixed(1) ?? '—'}</div>
												) : (
													<div>ON/OFF averages not available yet.</div>
												)}
											</div>
										)}
									</div>
								)
							})}
						</div>
					</div>
				)
			})}
		</div>
	)
}


