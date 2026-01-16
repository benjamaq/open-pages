'use client'

import React from 'react'

type Props = {
	monthlySpend: number
	activeCount: number
	potentialSavingsMonthly: number
	potentialSavingsRuleLabel: string
	fmtMoney: (n?: number | null) => string
	fmtYear: (monthly?: number | null) => string
}

export default function StackEconomicsCard(props: Props) {
	const {
		monthlySpend,
		activeCount,
		potentialSavingsMonthly,
		potentialSavingsRuleLabel,
		fmtMoney,
		fmtYear
	} = props
	return (
		<div className="rounded-xl border border-[#E8E4DD] bg-[#FAF8F5] p-5">
			<div className="text-[11px] font-semibold text-[#6B7280] uppercase">Stack Economics</div>
			<div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div>
					<div className="text-[#6B7280] text-sm">Monthly Spend</div>
					<div className="text-[20px] font-semibold text-[#111111]">{fmtMoney(monthlySpend)}</div>
				</div>
				<div>
					<div className="text-[#6B7280] text-sm">Annual Spend</div>
					<div className="text-[20px] font-semibold text-[#111111]">{fmtYear(monthlySpend)}</div>
				</div>
				<div>
					<div className="text-[#6B7280] text-sm">Active Supps</div>
					<div className="text-[20px] font-semibold text-[#111111]">{activeCount}</div>
				</div>
			</div>
			<div className="mt-3 text-[15px] text-[#111111]">
				Potential Savings: <span className="font-semibold">{fmtMoney(potentialSavingsMonthly)}</span> <span className="text-[#6B7280]">({fmtYear(potentialSavingsMonthly)})</span>
			</div>
			<div className="text-xs text-[#6B7280] mt-1">Based on {potentialSavingsRuleLabel}</div>
		</div>
	)
}

