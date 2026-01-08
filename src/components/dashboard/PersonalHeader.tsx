'use client'

import { useEffect, useState } from 'react'

export function PersonalHeader() {
  const [firstName, setFirstName] = useState<string | null>(null)
	const [suppCount, setSuppCount] = useState<number>(0)
  const [readyCount, setReadyCount] = useState<number>(0)

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
            rdy = all.filter((r: any) => {
              const on = Number(r?.daysOnClean ?? r?.daysOn ?? 0)
              const off = Number(r?.daysOffClean ?? r?.daysOff ?? 0)
              const reqOn = Number(r?.requiredOnDays ?? r?.requiredDays ?? 14)
              const reqOff = Number(r?.requiredOffDays ?? Math.min(5, Math.max(3, Math.round((r?.requiredDays ?? 14) / 4))))
              return on >= reqOn && off >= reqOff
            }).length
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
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  return (
    <section>
      <h1 className="text-3xl font-semibold text-[#111111]">{getGreeting(firstName)}</h1>
      <p className="mt-1 text-sm text-[#4B5563]">
        {(() => {
          const total = Math.max(0, suppCount)
          if (total === 0) return 'No supplements added yet'
          if (readyCount <= 0) return `${total} supplements under evaluation • Building your baseline`
          if (readyCount >= total) return `All verdicts ready`
          const building = Math.max(0, total - readyCount)
          return `${readyCount} verdict${readyCount === 1 ? '' : 's'} ready • Building ${building} more`
        })()}
      </p>
    </section>
  )
}


