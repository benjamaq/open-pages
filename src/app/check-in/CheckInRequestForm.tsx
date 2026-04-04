'use client'

import { useState, type FormEvent } from 'react'

function CohortCheckInHeader() {
  return (
    <header className="mb-10">
      <div className="flex items-center justify-between gap-4">
        <img
          src="/DNA-logo-black.png"
          alt="DoNotAge"
          className="h-8 w-auto max-w-[132px] object-contain object-left"
          width={132}
          height={32}
        />
        <img
          src={encodeURI('/BIOSTACKR LOGO 2.png')}
          alt="BioStackr"
          className="h-8 w-auto max-w-[168px] object-contain object-right"
          width={168}
          height={32}
        />
      </div>
      <p className="mt-4 text-center text-xs font-medium tracking-wide text-neutral-500">DoNotAge × BioStackr</p>
    </header>
  )
}

export default function CheckInRequestForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setStatus('loading')
    try {
      const res = await fetch('/api/cohort/request-login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string }
      if (!res.ok) {
        setStatus('error')
        setError(typeof j.error === 'string' ? j.error : 'Something went wrong.')
        return
      }
      setStatus('sent')
    } catch {
      setStatus('error')
      setError('Something went wrong.')
    }
  }

  if (status === 'sent') {
    return (
      <div className="min-h-screen bg-[#f4f3f1]">
        <div className="mx-auto max-w-md px-6 py-12">
          <CohortCheckInHeader />
          <div className="rounded-xl border border-neutral-200/80 bg-white px-5 py-8 text-center shadow-sm">
            <p className="text-lg text-neutral-900">Check your email for your sign-in link.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f3f1]">
      <div className="mx-auto max-w-md px-6 py-12">
        <CohortCheckInHeader />
        <div className="rounded-xl border border-neutral-200/80 bg-white px-5 py-8 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">Continue to your check-in</h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Enter your email and we&apos;ll send you a sign-in link.
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <label className="block text-left text-sm font-medium text-neutral-700">
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                disabled={status === 'loading'}
              />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-lg bg-[#C84B2F] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a63d26] disabled:opacity-60"
            >
              {status === 'loading' ? 'Sending…' : 'Email me a sign-in link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
