'use client'

import React from 'react'

type Props = {
	open: boolean
	onClose: () => void
	title?: string
	status?: string
	monthly?: number | null
	fmtMoney: (n?: number | null) => string
	details?: {
		onAvg?: number | null
		offAvg?: number | null
		daysOn?: number | null
		daysOff?: number | null
		reqOn?: number | null
		reqOff?: number | null
		confidenceText?: string | null
		effectText?: string | null
		recommendation?: string | null
	}
}

export default function StackInsightPanel(props: Props) {
	const { open, onClose, title, status, monthly, fmtMoney, details } = props
	return (
		<div className={`fixed top-0 right-0 h-full w-full sm:w-[380px] bg-white shadow-2xl border-l border-[#E4E1DC] transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`} style={{ zIndex: 60 }}>
			<div className="p-4 border-b border-[#EFEDE9] flex items-center justify-between">
				<div className="min-w-0">
					<div className="text-sm font-semibold text-[#111111] truncate">{title || 'Supplement'}</div>
					<div className="text-xs text-[#6B7280]">{status || ''}</div>
				</div>
				<button onClick={onClose} className="text-xs text-[#6B7280] underline">Close</button>
			</div>
			<div className="p-4 text-sm">
				<div className="flex items-center justify-between mb-3">
					<div className="text-[#6B7280]">Monthly cost</div>
					<div className="text-[#111111] font-medium">{fmtMoney(monthly)}</div>
				</div>
				<div className="text-xs font-semibold text-[#6B7280] uppercase mb-2">Evidence</div>
				{(typeof details?.onAvg === 'number' || typeof details?.offAvg === 'number') ? (
					<div className="grid grid-cols-2 gap-3 mb-2">
						<div className="rounded-lg border border-[#E4E1DC] p-3 bg-[#FAFAF9]">
							<div className="text-xs text-[#6B7280] mb-0.5">Average ON</div>
							<div className="font-medium">{typeof details?.onAvg === 'number' ? details!.onAvg!.toFixed(1) : '—'}</div>
						</div>
						<div className="rounded-lg border border-[#E4E1DC] p-3 bg-[#FAFAF9]">
							<div className="text-xs text-[#6B7280] mb-0.5">Average OFF</div>
							<div className="font-medium">{typeof details?.offAvg === 'number' ? details!.offAvg!.toFixed(1) : '—'}</div>
						</div>
					</div>
				) : (
					<div className="text-xs text-[#4B5563] mb-2">ON/OFF averages not available yet.</div>
				)}
				{(typeof details?.daysOn === 'number' || typeof details?.daysOff === 'number') && (
					<div className="text-xs text-[#4B5563] mb-2">
						Clean days used — ON {details?.daysOn ?? 0} • OFF {details?.daysOff ?? 0}
					</div>
				)}
				{(details?.effectText || details?.confidenceText) && (
					<div className="text-xs text-[#4B5563] mb-2">
						{details?.effectText ? details.effectText : ''}{details?.confidenceText ? (details.effectText ? ' • ' : '') + details.confidenceText : ''}
					</div>
				)}
				{details?.recommendation && (
					<div className="text-xs text-[#4B5563] mb-2">{details.recommendation}</div>
				)}
				<div className="text-xs font-semibold text-[#6B7280] uppercase mb-2">Actions</div>
				<div className="flex flex-wrap gap-2">
					<button className="px-3 py-1.5 rounded border border-[#E4E1DC] hover:bg-[#FAFAF9]" onClick={() => alert('Archive (stub)')}>Archive</button>
					<button className="px-3 py-1.5 rounded border border-[#E4E1DC] hover:bg-[#FAFAF9]" onClick={() => alert('Retest (stub)')}>Retest</button>
					<button className="px-3 py-1.5 rounded border border-[#E4E1DC] hover:bg-[#FAFAF9]" onClick={() => alert('Stop (stub)')}>Stop</button>
				</div>
			</div>
		</div>
	)
}


