'use client'

import { useState } from 'react'
import { STUDY_COHORT_FULL_WAITLIST_SOURCE } from '@/lib/studyCohortFullWaitlistSource'

export function StudyCohortFullWaitlist({ cohortSlug }: { cohortSlug: string }) {
  const slugNorm = String(cohortSlug || '').trim().toLowerCase()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const em = email.trim().toLowerCase()
    if (!slugNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setErr('Enter a valid email.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/study-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohort_slug: slugNorm,
          email: em,
          source: STUDY_COHORT_FULL_WAITLIST_SOURCE,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(String((j as { error?: string }).error || 'Something went wrong.'))
        setBusy(false)
        return
      }
      setDone(true)
    } catch {
      setErr('Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative z-10 mt-5 w-full max-w-md space-y-4 text-left sm:mt-6">
      {done ? (
        <p className="text-[14px] font-medium leading-relaxed text-neutral-700">
          Thanks — we&apos;ll be in touch if a spot opens or when we run our next study.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <label htmlFor="study-full-waitlist-email" className="block text-[13px] font-medium text-neutral-800">
            Email address
          </label>
          <input
            id="study-full-waitlist-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErr(null)
            }}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[15px] text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            placeholder="you@example.com"
          />
          {err && <p className="text-[13px] text-red-600">{err}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-[8px] bg-neutral-900 px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          >
            {busy ? 'Saving…' : 'Join waitlist'}
          </button>
        </form>
      )}
    </div>
  )
}
