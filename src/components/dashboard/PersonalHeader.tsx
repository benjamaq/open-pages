'use client'

import { useEffect, useState } from 'react'

export function PersonalHeader() {
  const [firstName, setFirstName] = useState<string | null>(null)
	const [suppCount, setSuppCount] = useState<number>(0)
  const [readyCount, setReadyCount] = useState<number>(0)
  const [testingCount, setTestingCount] = useState<number>(0)
  const [isMember, setIsMember] = useState<boolean>(false)

  function getGreeting(name?: string | null) {
    const hour = new Date().getHours()
    const base =
      hour < 12 ? 'Good morning' :
      hour < 17 ? 'Good afternoon' :
      'Good evening'
    if (!name) return base
    return `${base}, ${name}`
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const me = await fetch('/api/me', { cache: 'no-store' })
        if (me.ok) {
          const j = await me.json()
          if (mounted) setFirstName((j?.firstName && String(j.firstName)) || null)
        }
      } catch {}
      try {
        // Always read from progress/loop for accurate totals and readiness
        let total = 0
        let rdy = 0
        let testing = 0
        try {
          const p = await fetch('/api/progress/loop', { cache: 'no-store' })
          if (p.ok) {
            const j = await p.json()
            const sec = j?.sections || {}
            const all: any[] = [
              ...(sec.clearSignal || []),
              ...(sec.building || []),
              ...(sec.noSignal || []),
              ...((sec.inconsistent || [])),
              ...((sec.needsData || [])),
            ]
            total = all.length
            // Derived state aligned with cards
            for (const r of all) {
              const verdictValue = String((r as any)?.verdict || '').toLowerCase()
              const effectCatLower = String((r as any)?.effectCategory || '').toLowerCase()
              const isImplicit = String((r as any)?.analysisSource || '').toLowerCase() === 'implicit'
              const hasFinalVerdict = (!isImplicit) && (['keep','drop'].includes(verdictValue) || ['works','no_effect','no_detectable_effect'].includes(effectCatLower))
              if (hasFinalVerdict) rdy++
              else testing++
            }
          }
        } catch {}
        // If no items found via progress API, fall back to /api/supplements count
        if (total === 0) {
          try {
            const s = await fetch('/api/supplements', { cache: 'no-store' })
            if (s.ok) {
              const arr = await s.json()
              total = Array.isArray(arr) ? arr.length : 0
            }
          } catch {}
        }
        if (mounted) {
          setSuppCount(total)
          setReadyCount(rdy)
          setTestingCount(testing)
        }
      } catch {}
    })()
    // Load membership (paid) status
    ;(async () => {
      try {
        let paid = false
        try {
          const r = await fetch('/api/billing/info', { cache: 'no-store' })
          if (r.ok) {
            const j = await r.json()
            paid = Boolean(j?.isPaid)
          }
        } catch {}
        if (!paid) {
          try {
            const pr = await fetch('/api/payments/status', { cache: 'no-store' })
            if (pr.ok) {
              const j = await pr.json()
              paid = !!(j as any)?.is_member
            }
          } catch {}
        }
        if (mounted) setIsMember(paid)
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  return (
    <section>
      <h1 className="text-2xl sm:text-3xl font-semibold leading-tight text-[#111111] break-words">{getGreeting(firstName)}</h1>
      <p className="mt-1 text-sm text-[#4B5563]">
        {(() => {
          const total = Math.max(0, suppCount)
          if (total === 0) return 'No supplements added yet'
          const completed = Math.max(0, readyCount) // final verdicts only
          const building = Math.max(0, testingCount)
          if (isMember) {
            if (completed <= 0) return `${total} supplements under evaluation • Building your baseline`
            if (completed >= total) return `All complete`
            return `${completed} complete • Building ${building} more`
          } else {
            if (completed <= 0) return `${total} supplements under evaluation • Building your baseline`
            if (completed >= total) return `All verdicts ready`
            return `${completed} verdict${completed === 1 ? '' : 's'} ready • Building ${building} more`
          }
        })()}
      </p>
    </section>
  )
}


