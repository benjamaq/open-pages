'use client'

import { useEffect, useMemo, useState } from 'react'
import { dedupedJson } from '@/lib/utils/dedupedJson'

export default function ElliCard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{
    crif: { celebration: string; reflection: string; insight: string; forwardHook: string }
    context: { streakDays: number; totalCheckins?: number }
  } | null>(null)
  const [firstVisitLines, setFirstVisitLines] = useState<string[] | null>(null)
  const [insightMeta, setInsightMeta] = useState<{ monthlySpend?: number; activeSuppCount?: number } | null>(null)
  const [timeStr, setTimeStr] = useState<string>('')
  const [firstName, setFirstName] = useState<string>(() => {
    if (typeof window === 'undefined') return 'there'
    try {
      const raw = window.localStorage.getItem('biostackr_first_name') || ''
      if (raw) return raw
      const key = Object.keys(window.localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
      if (key) {
        const token = JSON.parse(window.localStorage.getItem(key) || 'null')
        const email = token?.user?.email || token?.email || null
        if (email) return String(email).split('@')[0]
      }
      return 'there'
    } catch { return 'there' }
  })
  // Refresh first name from server (and client fallback)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Use the same /api/me request as the rest of the dashboard so it dedupes cleanly.
        const res = await dedupedJson<any>('/api/me', { cache: 'no-store', credentials: 'include' })
        if (!res.ok) return
        const data = res.data
        const fn = data?.firstName
        if (fn && typeof window !== 'undefined') {
          window.localStorage.setItem('biostackr_first_name', String(fn))
          if (mounted) setFirstName(String(fn))
        }
      } catch {}
      try {
        const mod = await import('@/lib/supabase/client')
        const sb = mod.createClient()
        const { data: { user } } = await sb.auth.getUser()
        const meta = (user as any)?.user_metadata || {}
        const guess = meta.first_name || (meta.full_name ? String(meta.full_name).split(' ')[0] : null) || (user?.email ? String(user.email).split('@')[0] : null)
        if (guess && typeof window !== 'undefined') {
          window.localStorage.setItem('biostackr_first_name', String(guess))
          if (mounted) setFirstName(String(guess))
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true); setError(null)
        const res = await fetch('/api/elli/crif', { cache: 'no-store', credentials: 'include' })
        const json = await res.json()
        if (!mounted) return
        if (!res.ok) throw new Error(json?.error || 'Failed')
        setData(json)
        // If first-visit (no check-ins), fetch insights to craft message
        if ((json?.context?.totalCheckins ?? 0) === 0) {
          try {
            const r = await fetch('/api/insights', { cache: 'no-store', credentials: 'include' })
            const j = await r.json()
            if (r.ok) {
              const monthly = j?.monthlySpend ?? 0
              const count = j?.activeSuppCount ?? 0
              const cats = Array.isArray(j?.categorySpend) ? j.categorySpend : []
              const top = cats.sort((a: any, b: any) => (b?.percentage || 0) - (a?.percentage || 0)).slice(0, 2)
              const topLabel = top.map((t: any) => t?.category).filter(Boolean).join(' and ')
              setFirstVisitLines([
                `Nice, ${firstName} — your stack is now mapped.`,
                `You’re spending about $${Number(monthly || 0).toFixed(0)}/month across ${count} active supplements.`,
                topLabel ? `Your stack leans toward ${topLabel}.` : 'We’ll learn where your spend matters most.',
                'Next step: daily check-ins so I can start proving what actually works for you.'
              ])
              setInsightMeta({ monthlySpend: monthly, activeSuppCount: count })
            }
          } catch {}
        }
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'Failed to load Elli')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Avoid hydration mismatch by setting time on client after mount
  useEffect(() => {
    setTimeStr(new Date().toLocaleString())
  }, [])

  return (
    <section
      className="rounded-2xl shadow-sm p-6"
      style={{
        border: '1px solid transparent',
        background:
          'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(180deg, rgba(2,6,23,0.10), rgba(255,255,255,0)) border-box'
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <div
                className="absolute inset-0 -m-2 rounded-full blur-xl opacity-70"
                style={{ background: 'radial-gradient(circle at 50% 50%, rgba(59,110,246,0.35), rgba(59,110,246,0) 65%)' }}
              />
              <div
                className="relative h-10 w-10 rounded-full text-white grid place-items-center font-semibold"
                style={{
                  background:
                    'radial-gradient(120% 120% at 30% 25%, #3B6EF6 0%, #1F2A44 55%, #0F172A 100%)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)'
                }}
              >
                E
              </div>
            </div>
            <div>
              <div className="text-xs tracking-wide" style={{ color: '#6B7280' }}>Elli’s Daily Insight</div>
              <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{timeStr}</div>
            </div>
          </div>
          {loading && <div className="text-sm mt-3" style={{ color: '#6B7280' }}>Loading…</div>}
          {error && <div className="text-sm mt-3 text-red-600">{error}</div>}
          {firstVisitLines && (
            <div className="mt-3 text-sm space-y-1 leading-6 tracking-tight" style={{ color: '#1F2937' }}>
              <div>{firstVisitLines[0]}</div>
              <div>{firstVisitLines[1]}</div>
              <div>{firstVisitLines[2]}</div>
              <div className="font-medium" style={{ color: '#1F2937' }}>{firstVisitLines[3]}</div>
            </div>
          )}
          {data && !firstVisitLines && (
            <div className="mt-3 text-sm space-y-1 leading-6 tracking-tight" style={{ color: '#1F2937' }}>
              <div>{data.crif.celebration}</div>
              <div>{data.crif.reflection}</div>
              <div>{data.crif.insight}</div>
              <div className="font-medium" style={{ color: '#1F2937' }}>{data.crif.forwardHook}</div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Streak" value={`${data?.context?.streakDays ?? 0} days`} />
          <Metric label="Monthly spend" value={insightMeta?.monthlySpend != null ? `$${Number(insightMeta.monthlySpend).toFixed(0)}` : '—'} />
          <Metric label="Active supplements" value={insightMeta?.activeSuppCount != null ? String(insightMeta.activeSuppCount) : '—'} />
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl p-3 transition hover:-translate-y-[1px]"
      style={{
        border: '1px solid transparent',
        background:
          'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(180deg, rgba(2,6,23,0.08), rgba(255,255,255,0)) border-box',
        boxShadow: '0 1px 0 rgba(15,23,42,0.04)'
      }}
    >
      <div className="text-[10px] uppercase tracking-wide" style={{ color: '#6B7280' }}>{label}</div>
      <div className="text-xl font-semibold leading-6" style={{ color: '#1F2937' }}>{value}</div>
      <div className="text-[10px]" style={{ color: '#6B7280' }}> </div>
    </div>
  )
}


