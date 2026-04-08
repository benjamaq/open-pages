'use client'

import { useState } from 'react'

type Props = {
  idPrefix?: string
  /** Heading shown above the form (e.g. dashboard vs login). */
  heading?: string
  lead?: string | null
  submitLabel?: string
  className?: string
  /** Prefill when present (e.g. `/login?email=` from recovery flows). */
  initialEmail?: string
}

export function CohortResendLoginLinkForm({
  idPrefix = 'cohort-resend-login',
  heading = 'Send me a new login link',
  lead = null,
  submitLabel = 'Send me a new login link',
  className = '',
  initialEmail = '',
}: Props) {
  const [email, setEmail] = useState(() => initialEmail.trim())
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    const em = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError('Enter a valid email address.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/cohort/request-login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(String((j as { error?: string }).error || 'Something went wrong.'))
        return
      }
      setMessage(String((j as { message?: string }).message || 'Check your inbox for the new link.'))
      setEmail('')
    } catch {
      setError('Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={className}>
      <h2 className="text-sm font-semibold text-slate-900">{heading}</h2>
      {lead ? <p className="mt-2 text-sm text-slate-600 leading-relaxed">{lead}</p> : null}
      {message ? (
        <p className="mt-3 text-sm text-slate-700 leading-relaxed" role="status">
          {message}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 space-y-3 text-left">
          <label htmlFor={`${idPrefix}-email`} className="block text-xs font-medium text-slate-700">
            Email you used for the study
          </label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            placeholder="you@example.com"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-[#C84B2F] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C84B2F] focus-visible:ring-offset-2"
          >
            {busy ? 'Sending…' : submitLabel}
          </button>
        </form>
      )}
    </div>
  )
}
