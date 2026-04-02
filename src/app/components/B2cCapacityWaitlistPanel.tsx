'use client'

import Link from 'next/link'
import { useState } from 'react'

const SOURCE = 'b2c_capacity'

export function B2cCapacityWaitlistPanel({
  variant = 'page',
  onSuccess,
  onRequestClose,
  showNavLinks = true,
  headingId = 'b2c-capacity-heading',
}: {
  variant?: 'modal' | 'page'
  onSuccess?: () => void
  onRequestClose?: () => void
  /** Show For Brands + home on full-page variant */
  showNavLinks?: boolean
  /** Unique id when multiple panels exist (avoid duplicate ids in DOM) */
  headingId?: string
}) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const em = email.trim().toLowerCase()
    if (!em) {
      setErr('Please enter your email.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/waitlist/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em, source: SOURCE }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 409 && j?.alreadyExists) {
          setDone(true)
          onSuccess?.()
          return
        }
        setErr(typeof j?.error === 'string' ? j.error : 'Something went wrong. Try again.')
        return
      }
      setDone(true)
      setEmail('')
      onSuccess?.()
    } catch {
      setErr('Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const shell =
    variant === 'modal'
      ? 'rounded-2xl bg-white p-6 sm:p-8 shadow-2xl ring-1 ring-black/5 max-w-md w-full mx-4'
      : 'rounded-2xl bg-white p-8 sm:p-10 shadow-lg ring-1 ring-black/5 max-w-md w-full mx-auto'

  return (
    <div className={shell}>
      {variant === 'modal' && onRequestClose ? (
        <div className="flex justify-end -mt-2 -mr-2 mb-2">
          <button
            type="button"
            onClick={onRequestClose}
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Close"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      ) : null}

      <h2 id={headingId} className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight">
        BioStackr is currently at capacity
      </h2>
      <p className="mt-4 text-sm sm:text-base text-neutral-600 leading-relaxed">
        We&apos;re not accepting new users right now.
      </p>
      <p className="mt-3 text-sm sm:text-base text-neutral-600 leading-relaxed">
        We limit how many people can use BioStackr at any one time to maintain the quality of results.
      </p>
      <p className="mt-3 text-sm sm:text-base text-neutral-600 leading-relaxed">
        Leave your email below and we&apos;ll let you know as soon as new spots open.
      </p>

      {done ? (
        <p className="mt-6 text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          You&apos;re on the list. We&apos;ll email you when access opens.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label htmlFor="b2c-waitlist-email" className="sr-only">
            Email
          </label>
          <input
            id="b2c-waitlist-email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
          />
          <p className="text-xs text-neutral-500 leading-snug">
            No spam. We&apos;ll only email you when access opens.
          </p>
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-neutral-900 text-white text-sm font-semibold py-3.5 px-4 hover:bg-neutral-800 disabled:opacity-60 transition-colors"
          >
            {busy ? 'Joining…' : 'Join the waitlist'}
          </button>
        </form>
      )}

      {variant === 'page' && showNavLinks ? (
        <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 text-sm">
          <Link href="/cohorts" className="text-neutral-700 underline underline-offset-2 hover:text-neutral-900">
            For brands &amp; cohort studies →
          </Link>
          <Link href="/" className="text-neutral-700 underline underline-offset-2 hover:text-neutral-900">
            Back to home
          </Link>
        </div>
      ) : null}
    </div>
  )
}
