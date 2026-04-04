'use client'

import { useState, type FormEvent } from 'react'

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
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-lg text-gray-900">Check your email for your sign-in link.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold text-gray-900">Continue to your check-in</h1>
      <p className="mt-3 text-gray-600">Enter your email and we&apos;ll send you a sign-in link.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-left text-sm font-medium text-gray-700">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            disabled={status === 'loading'}
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {status === 'loading' ? 'Sending…' : 'Email me a sign-in link'}
        </button>
      </form>
    </div>
  )
}
