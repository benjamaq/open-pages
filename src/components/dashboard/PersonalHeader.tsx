'use client'

import { useEffect, useState } from 'react'

export function PersonalHeader() {
  const [firstName, setFirstName] = useState<string | null>(null)
	const [suppCount, setSuppCount] = useState<number>(0)

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
				// Prefer /api/supplements, but fall back to /api/progress/loop
				let count = 0
				const s = await fetch('/api/supplements', { cache: 'no-store' })
				if (s.ok) {
					const arr = await s.json()
					count = Array.isArray(arr) ? arr.length : 0
				}
				if (count === 0) {
					try {
						const p = await fetch('/api/progress/loop', { cache: 'no-store' })
						if (p.ok) {
							const j = await p.json()
							const sec = j?.sections || {}
							const total =
								(sec.clearSignal?.length || 0) +
								(sec.building?.length || 0) +
								(sec.noSignal?.length || 0) +
								((sec.inconsistent?.length) || 0) +
								((sec.needsData?.length) || 0)
							count = Number(total) || count
						}
					} catch {}
				}
				if (mounted) setSuppCount(count)
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  return (
    <section>
      <h1 className="text-3xl font-semibold text-[#111111]">{getGreeting(firstName)}</h1>
      <p className="mt-1 text-sm text-[#4B5563]">{suppCount} supplements under analysis • Baseline data collection in progress</p>
    </section>
  )
}


