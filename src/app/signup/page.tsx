'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { clearDraft } from '@/lib/onboarding/draft'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center">Loading…</div>}>
      <SignupInner />
    </Suspense>
  )
}

function SignupInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showAccessCode, setShowAccessCode] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function redeemAccessCode(codeRaw: string): Promise<{ redeemed: boolean; hardUnlock: boolean; error?: string }> {
    const code = String(codeRaw || '').trim().toUpperCase()
    if (!code) return { redeemed: false, hardUnlock: false }

    // Persist so AuthSessionHydrator can retry later (e.g., if signup requires email verification)
    try { localStorage.setItem('bs_pending_access_code', code) } catch {}

    // Try redeem now (works when user session is active immediately after signUp)
    try {
      const r = await fetch('/api/promo/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      const j = await r.json().catch(() => ({} as any))
      if (r.ok) {
        try { localStorage.removeItem('bs_pending_access_code') } catch {}
        return { redeemed: true, hardUnlock: true }
      }
      const msg = String(j?.error || '').trim()

      // If it wasn't a promo code, try beta code validation.
      if (msg === 'Code not found') {
        const b = await fetch('/api/beta/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        })
        if (b.ok) {
          try { localStorage.removeItem('bs_pending_access_code') } catch {}
          return { redeemed: true, hardUnlock: true }
        }
        try { localStorage.removeItem('bs_pending_access_code') } catch {}
        return { redeemed: false, hardUnlock: false, error: 'Code not found' }
      }

      // Other promo errors: don't keep retrying.
      if (msg) {
        try { localStorage.removeItem('bs_pending_access_code') } catch {}
        return { redeemed: false, hardUnlock: false, error: msg }
      }
      return { redeemed: false, hardUnlock: false }
    } catch {
      // Keep pending code for hydrator retry (offline, auth not ready, etc.)
      return { redeemed: false, hardUnlock: false }
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    // Debug: trace plan params
    try { console.log('Plan param:', params.get('plan'), 'Period param:', params.get('period')) } catch {}
    let createdUserId: string | null = null
    try {
      const supabase = createClient()
      const cleanEmail = email.trim()
      const cleanName = name.trim()
      const firstName = cleanName.split(' ')[0] || cleanName
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: cleanName,
            first_name: firstName,
            // Default daily reminders ON at 08:00 local by default
            reminder_enabled: true,
            reminder_time: '08:00'
          }
        }
      })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      // Ensure a profile row exists with display_name
      if (data?.user) {
        createdUserId = String(data.user.id)
        try {
          const baseSlug = cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
          const ts = Date.now().toString(36)
          const slug = `${baseSlug}-${ts}`
          await supabase
            .from('profiles')
            .upsert({
              user_id: data.user.id,
              display_name: cleanName,
              first_name: firstName,
              slug,
              public: true,
              allow_stack_follow: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as any, { onConflict: 'user_id', ignoreDuplicates: false })
        } catch (e) {
          // non-fatal
          console.warn('profiles upsert failed (anon client):', e)
        }
        // Service role bootstrap to bypass RLS in edge cases
        try {
          await fetch('/api/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: data.user.id, name: cleanName, email: cleanEmail })
          })
        } catch (e) {
          console.warn('profiles bootstrap failed:', e)
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Auth client error. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      setLoading(false)
      return
    }
    setLoading(false)
    // Prevent cross-account bleed: clear any previous onboarding draft
    try { clearDraft() } catch {}

    // If an access code was provided, try to redeem immediately. If it unlocks Pro, skip Stripe checkout even on paid plan URLs.
    const codeRes = await redeemAccessCode(accessCode)
    if (codeRes?.error) {
      setMessage(codeRes.error)
    } else if (codeRes?.redeemed) {
      setMessage('🎉 Code applied — Pro unlocked!')
    }

    // Redirect based on plan from URL
    const plan = (params.get('plan') || '').toLowerCase()
    const period = (params.get('period') || 'monthly').toLowerCase()
    if (!codeRes?.hardUnlock && (plan === 'premium' || plan === 'pro')) {
      try {
        console.log('Creating Stripe session...')
        const res = await fetch('/api/billing/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: 'premium',
            period,
            userId: createdUserId,
            userEmail: email.trim()
          })
        })
        const j = await res.json()
        try { console.log('Stripe response:', j) } catch {}
        if (res.ok && j?.url) {
          window.location.href = j.url
          return
        }
      } catch (e) {
        // Fall through to onboarding if checkout cannot start
      }
    }
    router.push('/onboarding')
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
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Create your BioStackr account</h1>
          <p className="mt-2 text-gray-600">Start testing your supplements.</p>
        </div>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid gap-1">
            <label className="text-sm text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Eddie"
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
            />
            <div className="text-xs text-gray-500 mt-1">Used for your dashboard and reports.</div>
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
            />
            <div className="text-xs text-gray-500 mt-1">At least 8 characters.</div>
          </div>
          <div className="pt-1">
            <button
              type="button"
              className="text-sm text-gray-700 hover:underline"
              onClick={() => setShowAccessCode(v => !v)}
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
                />
                <div className="text-xs text-gray-500 mt-1">Optional. If valid, we’ll apply it right after signup.</div>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && !error && <p className="text-sm text-gray-700">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <div className="mt-4 text-sm text-gray-600 text-center">
          Already have an account?{' '}
          <Link className="hover:underline" href="/login" style={{ color: '#6A3F2B' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}


