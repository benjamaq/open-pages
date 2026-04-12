'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function safeAdminNext(raw: string | null): string {
  const def = '/admin/cohorts'
  if (!raw || typeof raw !== 'string') return def
  const t = raw.trim()
  if (!t.startsWith('/') || t.startsWith('//') || !t.startsWith('/admin')) return def
  return t
}

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeAdminNext(searchParams.get('next'))
  const reason = searchParams.get('reason')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signErr) {
        setError(signErr.message)
        setLoading(false)
        return
      }
      // Full navigation so the session cookie is visible to middleware on the next request
      // (avoids landing on / or /dashboard after a soft client transition).
      window.location.assign(next)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  const onSignOut = async () => {
    setSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.refresh()
    } catch {
      /* ignore */
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Admin sign in</h1>
        {reason === 'forbidden' ? (
          <div
            className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
            role="alert"
          >
            <p className="font-medium">This account is not allowed to open the admin panel.</p>
            <p className="mt-2 text-amber-900/90">
              In Vercel, set env{' '}
              <code className="rounded bg-amber-100/80 px-1 text-xs">ADMIN_PANEL_ALLOWED_EMAILS</code> to a
              comma-separated list that includes the exact email you sign in with (then redeploy). Your personal
              BioStackr login will not work until that email is on the list.
            </p>
            <button
              type="button"
              onClick={onSignOut}
              disabled={signingOut}
              className="mt-3 text-sm font-medium text-amber-950 underline underline-offset-2 hover:no-underline disabled:opacity-50"
            >
              {signingOut ? 'Signing out…' : 'Sign out and try a different email'}
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-600">
            Use a staff Supabase user. Your email must match an entry in Vercel env{' '}
            <code className="text-xs">ADMIN_PANEL_ALLOWED_EMAILS</code> (exact variable name). Open{' '}
            <span className="font-medium text-gray-800">/admin/login</span> — not the participant page at{' '}
            <span className="font-medium text-gray-800">/login</span>.
          </p>
        )}
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-gray-800">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-800">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          <Link href="/login" className="text-gray-900 underline underline-offset-2">
            Participant login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen grid place-items-center text-gray-600">Loading…</div>}
    >
      <AdminLoginForm />
    </Suspense>
  )
}
