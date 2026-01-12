'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type SelectedSupplement = {
  productId: string
  name: string
  brandName: string
  primaryGoals?: string[]
  dailyDoseAmount: number
  dailyDoseUnit: string
  daysPerWeek: number
  pricePerContainer: number
  servingsPerContainer: number
}

export default function OnboardingReveal() {
  const router = useRouter()
  const [supplements, setSupplements] = useState<SelectedSupplement[]>([])
  const [priorities, setPriorities] = useState<string[]>([])

  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem('onboarding_supplements') || '[]')
      const p = JSON.parse(sessionStorage.getItem('onboarding_priorities') || '[]')
      setSupplements(s)
      setPriorities(p)
    } catch {}
  }, [])

  const supplementsWithCategories = useMemo(() => {
    return supplements.map(s => {
      const cat = (s.primaryGoals && s.primaryGoals[0]) || 'other'
      return {
        ...s,
        category: cat,
        monthlyCost: calculateDefaultMonthlyCost(s)
      }
    })
  }, [supplements])

  const totalMonthly = useMemo(() => supplementsWithCategories.reduce((a, b) => a + b.monthlyCost, 0), [supplementsWithCategories])
  const totalYearly = Math.round(totalMonthly * 12)
  const categorySpending = useMemo(() => groupByCategory(supplementsWithCategories), [supplementsWithCategories])
  const topPriorities = priorities.slice(0, 3)
  const priorityTotal = categorySpending.filter(c => topPriorities.includes(c.category)).reduce((s, c) => s + c.amount, 0)
  const nonPriorityTotal = totalMonthly - priorityTotal
  const insight = generateMismatchInsight(priorities, categorySpending)
  const missingSuggestions = getMissingSuggestions(priorities, supplementsWithCategories)

  async function completeOnboarding() {
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplements, priorities })
      })
    } catch {}
    sessionStorage.clear()
    router.push('/dashboard')
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="text-sm text-slate-500 mb-2">Step 3 of 3</div>
        <h1 className="text-3xl font-bold mb-3">Here’s what your supplement stack reveals:</h1>
      </div>

      <Section title="💰 The Investment">
        <div className="text-5xl font-bold text-slate-900 mb-2">
          ${Math.round(totalMonthly).toString()}<span className="text-2xl text-slate-500">/month</span>
        </div>
        <div className="text-lg text-slate-600">
          ${totalYearly}/year on {supplements.length} supplement{supplements.length !== 1 ? 's' : ''}
        </div>
      </Section>

      <Section title="🎯 The Mismatch">
        <div className="mb-6">
          <h3 className="font-semibold mb-3">You say you care about:</h3>
          <ol className="list-decimal list-inside space-y-1 text-slate-700">
            {topPriorities.map(p => <li key={p}>{formatPriority(p)}</li>)}
          </ol>
        </div>
        <div>
          <h3 className="font-semibold mb-3">But your money goes to:</h3>
          <div className="space-y-3">
            {categorySpending.map(cat => {
              const isPriority = topPriorities.includes(cat.category)
              return (
                <div key={cat.category} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isPriority ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{formatPriority(cat.category)}</span>
                      <span className="text-sm text-slate-600">${Math.round(cat.amount)}/mo • {cat.percentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${isPriority ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${cat.percentage}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Section>

      <Section title="💡 The Insight">
        <p className="text-slate-900 leading-relaxed">{insight.text}</p>
        {nonPriorityTotal > totalMonthly * 0.25 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-medium">
            🧪 You could be wasting ${Math.round(nonPriorityTotal)}/month on lower-priority items.
          </div>
        )}
      </Section>

      {missingSuggestions.length > 0 && (
        <Section title="🤔 You’re Missing">
          <p className="text-slate-700 mb-4">
            You care about <strong>{formatPriority(missingSuggestions[0]?.category || priorities[0] || 'other')}</strong>, but you’re not taking:
          </p>
          <div className="grid gap-3">
            {missingSuggestions.map(sugg => (
              <div key={sugg.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-semibold">{sugg.name}</div>
                  <div className="text-sm text-slate-600">{sugg.benefit}</div>
                </div>
                <button onClick={() => addSuggestionToStack(sugg)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">+ Add</button>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Let’s find out what actually works</h2>
        <p className="text-indigo-100 mb-6">Start tracking daily to see which supplements are worth your money.</p>
        <button onClick={completeOnboarding} className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-indigo-50">Start testing my stack →</button>
      </div>

      <button onClick={() => router.back()} className="mt-6 text-slate-500 text-sm">← Back</button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-6">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">{title}</div>
      {children}
    </div>
  )
}

function calculateDefaultMonthlyCost(s: SelectedSupplement) {
  const price = Number(s.pricePerContainer) || 0
  const servingsPerContainer = Number(s.servingsPerContainer) || 0
  if (!price || !servingsPerContainer) return 0
  // dailyDoseAmount means SERVINGS PER DAY (not pill count per serving). Default to 1 serving/day if missing.
  const servingsPerDay = Math.max(1, Number(s.dailyDoseAmount) || 1)
  const daysPerWeek = Math.max(1, Math.min(7, Number(s.daysPerWeek) || 7))
  const weeklyServings = servingsPerDay * daysPerWeek
  const monthlyServings = (weeklyServings * 30) / 7
  const costPerServing = price / servingsPerContainer
  const cost = monthlyServings * costPerServing
  return Math.round(cost * 100) / 100
}

function groupByCategory(list: any[]) {
  const total = list.reduce((sum, r) => sum + r.monthlyCost, 0)
  const map: Record<string, number> = {}
  for (const r of list) map[r.category] = (map[r.category] || 0) + r.monthlyCost
  return Object.entries(map).map(([category, amount]) => ({
    category,
    amount,
    percentage: total ? Math.round((amount / total) * 100) : 0
  })).sort((a, b) => b.amount - a.amount)
}

function formatPriority(k: string) {
  const dict: Record<string, string> = {
    sleep: 'Sleep',
    gut: 'Gut health',
    cognitive: 'Cognitive performance',
    energy: 'Energy & stamina',
    longevity: 'Longevity',
    immunity: 'Immunity',
    mood: 'Stress & mood',
    other: 'Other'
  }
  return dict[k] || k
}

function generateMismatchInsight(priorities: string[], cat: any[]) {
  if (!priorities.length || !cat.length) return { text: 'Add supplements and priorities to reveal your insight.' }
  const topPriority = priorities[0]
  const topSpend = cat[0]
  if (topSpend.category !== topPriority) {
    const topPrioritySpend = cat.find((c: any) => c.category === topPriority)
    let text = `${formatPriority(topSpend.category)} takes ${topSpend.percentage}% of your budget, but ${formatPriority(topPriority)} is your #1.\n\n`
    if (topPrioritySpend) text += `You’re spending $${Math.round(topPrioritySpend.amount)}/mo on your top priority.\n\n`
    else text += `You’re not taking anything for ${formatPriority(topPriority)} right now.\n\n`
    text += 'This disconnect is common — easy to fix with a focused test plan.'
    return { text }
  }
  return { text: 'Your spending aligns with your priorities. Now let’s verify which items actually work for you.' }
}

type Suggestion = { id: string; name: string; benefit: string; category: string }
function getMissingSuggestions(priorities: string[], current: any[]): Suggestion[] {
  const currentCats = new Set(current.map(r => r.category))
  const out: Suggestion[] = []
  for (const p of priorities.slice(0, 2)) {
    if (!currentCats.has(p)) {
      if (p === 'sleep') out.push({ id: 'canon_magnesium', name: 'Magnesium L‑Threonate', benefit: 'Supports sleep onset via GABA/glutamate balance', category: 'sleep' })
      if (p === 'cognitive') out.push({ id: 'canon_creatine', name: 'Creatine Monohydrate', benefit: 'Improves cognitive energy and working memory', category: 'cognitive' })
      if (p === 'immunity') out.push({ id: 'canon_vitd', name: 'Vitamin D3 + K2', benefit: 'Supports immune resilience', category: 'immunity' })
    }
  }
  return out
}

async function addSuggestionToStack(sugg: Suggestion) {
  try {
    await fetch('/api/stack-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: sugg.name, dose: null, item_type: 'supplements', frequency: 'daily' })
    })
  } catch {}
}


