'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { isInAppBrowser, openInSystemBrowser } from '@/lib/browser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showAccessCode, setShowAccessCode] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      // Persist session explicitly for hostile webviews
      try {
        const session = data?.session
        if (session) {
          localStorage.setItem('supabase_session', JSON.stringify(session))
        }
      } catch {}
      // Stash access code so AuthSessionHydrator can redeem after auth is established.
      if (accessCode.trim()) {
        try { localStorage.setItem('bs_pending_access_code', accessCode.trim().toUpperCase()) } catch {}
      }
    } catch (err: any) {
      setError(err?.message || 'Auth client error. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      setLoading(false)
      return
    }
    setLoading(false)
    router.push('/dashboard')
  }

  return (
    <div
      className="min-h-screen grid place-items-center p-6"
      style={{
        backgroundImage: "url('/sign in.png?v=1')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="w-full max-w-[520px] rounded-2xl border border-gray-200 bg-white/95 p-8 sm:p-10 shadow-lg ring-1 ring-black/5">
        {isInAppBrowser() && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <div className="font-medium mb-1">⚠️ Open in your browser to sign in</div>
            <p className="mb-2">In‑app browsers can block secure login. Tap the ••• menu and choose “Open in Browser”.</p>
            <div className="flex gap-2">
              <button
                onClick={openInSystemBrowser}
                className="flex-1 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-amber-800"
              >
                Open in Safari/Chrome
              </button>
            </div>
          </div>
        )}
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-gray-600">Pick up where you left off.</p>
        </div>
        <form onSubmit={onSubmit} className="mt-6 space-y-4" aria-disabled={isInAppBrowser()}>
          <div className="grid gap-1">
            <label className="text-sm text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
              disabled={isInAppBrowser()}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
              disabled={isInAppBrowser()}
            />
          </div>
          <div className="pt-1">
            <button
              type="button"
              className="text-sm text-gray-700 hover:underline"
              onClick={() => setShowAccessCode(v => !v)}
              disabled={isInAppBrowser()}
            >
              Have a promo or beta code?
            </button>
            {showAccessCode && (
              <div className="mt-2 grid gap-1">
                <label className="text-sm text-gray-700">Promo / Beta Code</label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter code (e.g., PH30)"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  autoCapitalize="characters"
                  disabled={isInAppBrowser()}
                />
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || isInAppBrowser()}
            className="w-full h-12 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="mt-4 text-sm text-gray-600 text-center">
          Don’t have an account?{' '}
          <Link className="hover:underline" href="/signup" style={{ color: '#6A3F2B' }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  )
}


