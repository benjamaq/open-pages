'use client'

import { } from 'react'

export function SupplementsInTesting({
  activeTests,
  microInsights,
  supplements
}: {
  activeTests: Array<{ supplementId: string; name: string; primaryGoal: string; daysCompleted: number; targetDays: number }>
  microInsights: Array<{ supplementName: string; metric: string; onAvg: number; offAvg: number; diff: number }>
  supplements: any[]
}) {
  const testing = (supplements || []).filter((s: any) => {
    const stage = s.stage == null ? 'hypothesis' : String(s.stage)
    return ['hypothesis', 'early_signal', 'validating', 'HYPOTHESIS', 'EARLY_SIGNAL', 'VALIDATING_POSITIVE', 'VALIDATING_NEGATIVE'].includes(stage)
  })
  const validated = (supplements || []).filter((s: any) => ['proven', 'PROVEN_BENEFICIAL', 'PROVEN_NEUTRAL', 'PROVEN_HARMFUL'].includes(String(s.stage)))
  return (
    <div className="space-y-8">
      {/* Proven first, per brief */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Proven Supplements</h2>
        <a href="/dashboard?add=1" className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800">+ Add supplement</a>
        </div>
        {validated.length > 0 ? (
          <div className="mt-4 space-y-4">
            {validated.map((supp: any) => (
              <div key={supp.id} className="rounded-xl border border-green-200 bg-green-50 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-green-900">{abbreviateSupplementName(String(supp?.name || ''))}</h4>
                    <p className="text-sm text-green-700">{supp.brand_name || 'Generic'}</p>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-green-600 text-white text-xs font-medium">PROVEN ✓</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-green-900"><strong>Result:</strong> Positive effect suggested</p>
                  <p className="text-green-800"><strong>Effect size:</strong> Cohort-adjusted</p>
                </div>
                <a className="mt-4 inline-block text-sm font-medium text-green-700 hover:text-green-900" href={`/supplements/${encodeURIComponent(supp.id)}/truth-report`}>View Full Truth Report →</a>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-600">No proven supplements yet.</p>
            <p className="text-xs text-slate-500 mt-1">Keep testing; proven results will appear here with confidence.</p>
          </div>
        )}
      </div>

      {/* Testing next */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-xl font-semibold text-slate-900">Testing in Progress</h2>
        <a href="/dashboard?add=1" className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800">+ Add supplement</a>
      </div>
      {testing.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">Hypothesis · Baseline Collection</h3>
          <div className="space-y-4">
            {testing.map((supp: any) => {
              const at = (activeTests || []).find(t => t.name === supp.name || t.supplementId === supp.id)
              const progress = at ? Math.max(0, Math.min(100, Math.round((at.daysCompleted / Math.max(1, at.targetDays)) * 100))) : 0
              const remaining = at ? Math.max(0, at.targetDays - at.daysCompleted) : 7
              const mi = (microInsights || []).find(i => i.supplementName?.toLowerCase() === String(supp.name || '').toLowerCase())
              const monthlyCost =
                typeof supp.monthly_cost_usd === 'number' ? supp.monthly_cost_usd :
                (() => {
                  const price = Number(supp.price_per_container || supp.pricePerContainer || 0)
                  const servings = Number(supp.servings_per_container || supp.servingsPerContainer || 0)
                  const dosePerDay = Number(supp.dose_per_serving_amount || supp.dailyDoseAmount || 1)
                  if (!price || !servings || !dosePerDay) return null
                  const costPerServing = price / servings
                  return Math.round(costPerServing * dosePerDay * 30 * 100) / 100
                })()
              return (
                <div key={supp.id} className="group relative overflow-hidden rounded-xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-orange-500" />
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">{abbreviateSupplementName(String(supp.name || ''))}</h4>
                        <p className="text-sm text-slate-500">{supp.brand_name || 'Generic'}</p>
                      </div>
                      <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-medium">HYPOTHESIS</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>Testing for: <strong className="text-slate-900">{at?.primaryGoal || (supp.primary_goal_tags?.[0] || 'General wellness')}</strong></span>
                      <span>·</span>
                      <span>Monthly cost: <strong className="text-slate-900">{monthlyCost != null ? `$${monthlyCost.toFixed(2)}` : '—'}</strong></span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Sample collection</span>
                        <span className="font-semibold text-slate-900">{at?.daysCompleted || 0}/{at?.targetDays || 7} days</span>
                      </div>
                      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>ON days: <strong className="text-slate-700">—</strong></span>
                        <span>OFF days: <strong className="text-slate-700">—</strong></span>
                        <span>Confounds: <strong className="text-slate-700">—</strong></span>
                      </div>
                    </div>
                    {mi && (
                      <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700 mb-2">Early Observation (Not Significant)</div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {mi.metric}: <strong>{mi.onAvg.toFixed(1)}</strong> (ON) vs <strong>{mi.offAvg.toFixed(1)}</strong> (OFF), Δ <strong className="text-indigo-600">{mi.diff > 0 ? '+' : ''}{mi.diff.toFixed(1)}</strong>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Sample insufficient for p-value calculation</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <p className="text-sm text-slate-600">{remaining} more clean day{remaining !== 1 ? 's' : ''} required for analysis</p>
                      <a className="text-sm font-medium text-indigo-600 hover:text-indigo-500" href={`/supplements/${encodeURIComponent(supp.id)}`}>View details →</a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <div className="text-slate-400 mb-2">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <p className="text-sm text-slate-600">No active tests</p>
          <p className="text-xs text-slate-500 mt-1">Supplements you add will show here with progress bars.</p>
        </div>
      )}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">Validated · Analysis Complete</h3>
        {validated.length > 0 ? (
          <div className="space-y-4">
            {validated.map((supp: any) => (
              <div key={supp.id} className="rounded-xl border border-green-200 bg-green-50 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-green-900">{abbreviateSupplementName(String(supp?.name || ''))}</h4>
                    <p className="text-sm text-green-700">{supp.brand_name || 'Generic'}</p>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-green-600 text-white text-xs font-medium">PROVEN ✓</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-green-900"><strong>Result:</strong> Positive effect suggested</p>
                  <p className="text-green-800"><strong>Effect size:</strong> Cohort-adjusted</p>
                </div>
                <a className="mt-4 inline-block text-sm font-medium text-green-700 hover:text-green-900" href={`/supplements/${encodeURIComponent(supp.id)}/truth-report`}>View Full Truth Report →</a>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-600">No truth reports available yet.</p>
            <p className="text-xs text-slate-500 mt-1">Continue tracking to generate first report.</p>
          </div>
        )}
      </div>
    </div>
  )
}


