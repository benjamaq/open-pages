'use client'

import type { UserContext } from '@/lib/types';

interface Props {
  context: UserContext;
}

export function StatusUpdate({ context }: Props) {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  let summary = ''
  let nextAction = ''
  if (context.daysTracked === 0) {
    summary = 'First check-in required. Baseline establishment begins now.'
    nextAction = 'Complete your first check-in to establish baseline metrics for comparison.'
  } else if (context.daysTracked === 1) {
    summary = 'First check-in completed. Baseline established.'
    nextAction = 'Complete daily check-ins for 6 more days to reach minimum sample size for statistical analysis.'
  } else if (context.daysTracked < 7) {
    const remaining = 7 - context.daysTracked
    summary = 'Data collection in progress.'
    nextAction = `Continue daily check-ins. ${remaining} day${remaining !== 1 ? 's' : ''} remaining until first statistical analysis.`
  } else if (context.hasNewTruthReport) {
    summary = 'Minimum sample size reached. Statistical analysis complete.'
    nextAction = 'Review Truth Report for detailed analysis and recommendations.'
  } else {
    summary = `Testing protocol active. ${context.daysTracked} days of continuous data.`
    nextAction = 'Continue tracking for ongoing validation.'
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-2xl">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255_/_0.15)_1px,transparent_0)] bg-[length:24px_24px]" />
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Status Update</h2>
          <div className="text-xs text-slate-500">Updated {timeStr}</div>
        </div>
        <p className="text-xl font-medium leading-relaxed text-slate-100">{summary}</p>
        {context.microInsights && context.microInsights.length > 0 && (
          <div className="space-y-3 rounded-lg bg-slate-800/50 p-4 border border-slate-700">
            {context.microInsights.slice(0, 1).map((insight, idx) => (
              <p key={idx} className="text-sm leading-relaxed text-slate-300">
                {insight.supplementName}: Preliminary signal detected ({insight.diff > 0 ? '+' : ''}{insight.diff.toFixed(1)} {insight.metric} differential). Sample size insufficient for significance testing ({insight.samplesOn} ON days, {insight.samplesOff} OFF days). Minimum 7 total days required.
              </p>
            ))}
          </div>
        )}
        <div className="flex items-start gap-3 rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-400 mb-1">Next Action</div>
            <p className="text-sm font-medium text-slate-200">{nextAction}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
          <Stat label="Check-ins logged" value={String(context.totalCheckins)} />
          <Stat label="Current streak" value={`${context.currentStreak} day${context.currentStreak !== 1 ? 's' : ''}`} />
          <Stat label="Supplements tracked" value={String(context.supplementCount ?? 0)} />
          <Stat label="Monthly spend" value={`$${(context.monthlySpendUsd ?? 0).toFixed(2)}`} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-lg font-semibold text-slate-100">{value}</div>
    </div>
  )
}


