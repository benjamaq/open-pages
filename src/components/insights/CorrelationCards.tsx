'use client'
import { useEffect, useMemo, useState } from 'react'

type Pattern = {
  id: string
  name: string
  effect_size: number
  confidence_score: number
  status: string
}

export function CorrelationCards() {
  const [patterns, setPatterns] = useState<Pattern[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/insights/patterns', { cache: 'no-store', credentials: 'include' })
        if (!mounted) return
        if (res.ok) {
          const data = await res.json()
          setPatterns(Array.isArray(data) ? data : [])
        } else {
          setPatterns([])
        }
      } catch {
        if (mounted) setPatterns([])
      }
    })()
    return () => { mounted = false }
  }, [])

  const cards = useMemo(() => {
    const significant = patterns
      .filter((p: any) => String(p.status || '').toLowerCase() === 'significant')
      .sort((a, b) => (Math.abs(b.effect_size || 0)) - (Math.abs(a.effect_size || 0)))
      .slice(0, 3)
      .map(p => {
        const dir = (p.effect_size || 0) > 0 ? '↑' : (p.effect_size || 0) < 0 ? '↓' : '→'
        const pct = Math.round(Math.abs((p.effect_size || 0) * 100))
        const conf = Math.round((p.confidence_score || 0) * 100)
        return {
          key: p.id,
          title: `${p.name} ${dir}`,
          body: `Estimated effect: ${pct}%`,
          strength: conf >= 80 ? '●●●●○ Strong' : conf >= 65 ? '●●●○○ Moderate' : '●●○○○ Weak',
          confidence: `${conf}%`,
          href: `/supplements/${p.id}`
        }
      })
    if (significant.length > 0) return significant
    return [{
      key: 'no-signal',
      title: '❓ No clear signal yet',
      body: 'Keep logging — results typically need 14+ clean days',
      strength: '',
      confidence: '',
      href: '/dashboard?checkin=1'
    }]
  }, [patterns])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="font-semibold text-slate-900 mb-1">🔥 WHAT&apos;S WORKING</div>
      <div className="text-sm text-slate-600 mb-4">Based on your check-ins and supplement timing</div>
      <div className="grid grid-cols-1 gap-3">
        {cards.map((c) => (
          <a key={c.key} href={c.href} className="rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className="font-semibold text-slate-900">{c.title}</div>
            <div className="text-sm text-slate-700 mt-2">{c.body}</div>
            {c.strength && <div className="text-xs text-slate-600 mt-2">Signal strength: {c.strength}</div>}
            {c.confidence && <div className="text-xs text-slate-600">Confidence: {c.confidence}</div>}
            <div className="text-sm text-indigo-600 mt-2">Details →</div>
          </a>
        ))}
      </div>
    </section>
  )
}

