'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '../lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { trackEvent, attachAttributionToParams, fireMetaEvent } from '@/lib/analytics'

interface AuthFormProps {
  mode: 'signin' | 'signup'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [showAccessCode, setShowAccessCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Promo code UX on auth signup (in case this form is used anywhere):
  // - Visible by default on signup
  // - Auto-fill from ?promo=PH30 and auto-show input
  useEffect(() => {
    if (mode !== 'signup') return
    try {
      setShowAccessCode(true)
      const promo = String(searchParams?.get('promo') || '').trim()
      if (promo && !accessCode.trim()) {
        setAccessCode(promo.toUpperCase())
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, searchParams])

  // Read and sanitize ?next= without using window to avoid hydration mismatches
  const nextUrl = useMemo(() => {
    try {
      const p = searchParams?.get('next') || ''
      // eslint-disable-next-line no-console
      try { console.log('[auth] decoded next param (from useSearchParams):', p) } catch {}
      if (!p) return null
      if (p.startsWith('/')) return p
      // As a safety, allow absolute same-origin links
      // We don't have access to window.origin during SSR; assume relative only
      return null
    } catch {
      return null
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    // Client-side validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Name is required')
      setLoading(false)
      return
    }


    try {
      const isInApp = /FBAN|FBAV|Instagram|Line|OKHttp|Twitter/i.test(navigator.userAgent || '')
      const viewport = { w: typeof window !== 'undefined' ? window.innerWidth : 0, h: typeof window !== 'undefined' ? window.innerHeight : 0 }
      // Pre-attempt log
      try { await fetch('/api/diag/signup-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phase: 'attempt', mode, email: email.trim(), referrer: document.referrer, userAgent: navigator.userAgent, isInApp, viewport }) }) } catch {}

      const cleanEmail = email.trim()
      const cleanName = name.trim()
      const cleanReferral = referralCode.trim()
      const cleanAccess = accessCode.trim()

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: cleanName,
              first_name: cleanName
            }
          }
        })

        if (error) {
          setError(error.message)
          try { await fetch('/api/diag/signup-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phase: 'error', mode, email: cleanEmail, error: error.message, referrer: document.referrer, userAgent: navigator.userAgent, isInApp, viewport }) }) } catch {}
        } else if (data.user) {
          // Fire GA sign_up with landing_variant
          try {
            const urlParams = new URLSearchParams(window.location.search)
            const landingVariant = urlParams.get('landing_variant') || urlParams.get('utm_content') || 'unknown'
            if (typeof window !== 'undefined' && (window as any).gtag) {
              ;(window as any).gtag('event', 'sign_up', { method: 'email', landing_variant: landingVariant })
            }
          } catch {}
          // Fire Meta Pixel LEAD (distinct from CompleteRegistration)
          try {
            await fireMetaEvent('Lead', {
              value: 0,
              currency: 'USD',
              content_name: 'user_signup'
            }, {
              email: cleanEmail,
              externalId: data.user.id
            })
          } catch {}
          // Fire Meta Pixel CompleteRegistration
          try { if (typeof window !== 'undefined' && (window as any).fbq) { (window as any).fbq('track','CompleteRegistration') } } catch {}
          try { await fetch('/api/diag/signup-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phase: 'success', mode, email: cleanEmail, referrer: document.referrer, userAgent: navigator.userAgent, isInApp, viewport }) }) } catch {}
          // Track signup event (production only)
          trackEvent('sign_up', { method: 'email', user_id: data.user.id })
          // Fire GA4 event directly for ads attribution (browser only)
          try {
            if (typeof window !== 'undefined' && (window as any).gtag) {
              ;(window as any).gtag('event', 'sign_up', { method: 'email' })
              // eslint-disable-next-line no-console
              console.log('✅ GA4: Signup event sent')
            }
          } catch {}
          // Fire Meta Pixel CompleteRegistration immediately with attribution + advanced matching
          try {
            const attrib = attachAttributionToParams({ value: 0, currency: 'EUR' })
            const method = await fireMetaEvent('CompleteRegistration', attrib, {
              email: cleanEmail,
              firstName: (cleanName || '').split(' ')[0] || undefined,
              lastName: (cleanName || '').split(' ').slice(1).join(' ') || undefined,
              externalId: data.user.id
            })
            console.log('✅ Meta Pixel: CompleteRegistration fired (AuthForm) via', method, 'with attribution', attrib)
          } catch {}
          // Initialize free subscription (idempotent)
          try {
            await supabase
              .from('user_subscriptions')
              .upsert({
                user_id: data.user.id,
                plan_type: 'free',
                status: 'active',
                current_period_start: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } as any, { onConflict: 'user_id', ignoreDuplicates: true })
          } catch (e) {
            console.warn('Free tier init failed (non-blocking):', e)
          }

          // Stash promo/beta access code for redemption after auth is established.
          // (Promo redemption requires an authenticated session; some projects require email verification before session is active.)
          if (cleanAccess) {
            try { localStorage.setItem('bs_pending_access_code', cleanAccess.toUpperCase()) } catch {}
          }
          // Create profile with anon client (may succeed if RLS allows). If it fails, we’ll fall back to server-side bootstrap.
          try {
            // Generate a unique slug
            const baseSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
            const timestamp = Date.now().toString(36)
            const uniqueSlug = `${baseSlug}-${timestamp}`
            
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .upsert({
                user_id: data.user.id,
                display_name: cleanName,
                referral_code: cleanReferral || null,
                referral_source: cleanReferral === 'redditgo' ? 'reddit' : null,
                slug: uniqueSlug,
                bio: null,
                avatar_url: null,
                public: true,
                allow_stack_follow: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } as any, {
                onConflict: 'user_id',
                ignoreDuplicates: false
              })
              .select()

            if (profileError) {
              // If it's a duplicate key error, that's actually okay - profile already exists
              if (profileError.code === '23505') {
                console.log('ℹ️ Profile already exists for user:', data.user.id)
              } else {
                console.error('❌ Profile creation error:', profileError)
              }
            } else {
              console.log('✅ Profile created successfully for user:', data.user.id)
            }
          } catch (profileError) {
            console.error('Profile upsert error (anon client):', profileError)
          }

          // Ensure profile exists via server-side bootstrap (service role, bypassing RLS)
          try {
            await fetch('/api/profiles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: data.user.id, name: cleanName, email: cleanEmail })
            })
          } catch (e) {
            console.warn('Profile bootstrap request failed', e)
          }

          // Check if access code is a beta code (promo codes are redeemed via /api/promo/redeem after auth).
          if (cleanAccess) {
            try {
              const betaResponse = await fetch('/api/beta/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: cleanAccess })
              })

              if (betaResponse.ok) {
                // Beta code activated! User gets Pro access
                setMessage('Beta code activated! You now have 6 months of free Pro access! 🎉 Redirecting...')
                // Fire Meta CompleteRegistration again to be safe before redirect (with advanced matching)
                try {
                  const attrib = attachAttributionToParams({ value: 0, currency: 'EUR' })
                  const method = await fireMetaEvent('CompleteRegistration', attrib, {
                    email: cleanEmail,
                    firstName: (cleanName || '').split(' ')[0] || undefined,
                    lastName: (cleanName || '').split(' ').slice(1).join(' ') || undefined,
                    externalId: data.user.id
                  })
                  console.log('✅ Meta Pixel: CompleteRegistration fired (beta path) via', method, 'with attribution', attrib)
                } catch {}
                setTimeout(() => {
                  try { sessionStorage.setItem('justSignedUp', '1') } catch {}
                  try { document.cookie = 'bs_cr=1; Max-Age=1800; Path=/; SameSite=Lax' } catch {}
                  try {
                    const urlParams = new URLSearchParams(window.location.search)
                    const nxt = urlParams.get('next')
                    if (nxt && nxt.startsWith('/')) {
                      window.location.href = nxt
                    } else {
                      window.location.href = '/onboarding'
                    }
                  } catch {
                    window.location.href = '/onboarding'
                  }
                }, 2000)
                return
              }
              // If not a valid beta code, continue as normal (it's just a referral code)
            } catch (betaError) {
              console.log('Not a beta code, treating as referral code:', betaError)
              // Continue as normal - it's just a referral code
            }
          }

          // Redirect to dashboard for new users
          const successMessage = referralCode.trim() === 'redditgo' 
            ? 'Account created successfully! Welcome from Reddit! 🎉 Redirecting...'
            : 'Account created successfully! Redirecting...'
          setMessage(successMessage)
          try { sessionStorage.setItem('justSignedUp', '1') } catch {}
          try { document.cookie = 'bs_cr=1; Max-Age=1800; Path=/; SameSite=Lax' } catch {}
          // Redirect immediately to preserve checkout flow
          if (nextUrl) {
            // If next points to billing start, route via /checkout to ensure session is ready
            try {
              const u = new URL(nextUrl, window.location.origin)
              if (u.pathname.startsWith('/api/billing/start')) {
                const plan = u.searchParams.get('plan') || 'premium'
                const period = u.searchParams.get('period') || 'monthly'
                window.location.assign(`/checkout?plan=${encodeURIComponent(plan)}&period=${encodeURIComponent(period)}`)
                return
              }
            } catch {}
            // Use hard navigation to ensure cookies are seen by server route
            if (typeof window !== 'undefined') {
              window.location.assign(nextUrl)
              return
            }
            router.replace(nextUrl)
            return
          } else {
            if (typeof window !== 'undefined') {
              window.location.href = '/onboarding'
            } else {
              router.replace('/onboarding')
              router.refresh()
            }
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setError(error.message)
        } else {
          // Stash promo/beta access code for redemption after auth is established.
          if (accessCode.trim()) {
            try { localStorage.setItem('bs_pending_access_code', accessCode.trim().toUpperCase()) } catch {}
          }
          try { sessionStorage.setItem('justSignedUp', '1') } catch {}
          if (nextUrl) {
            if (typeof window !== 'undefined') {
              window.location.href = nextUrl
            } else {
              router.replace(nextUrl)
            }
          } else {
            if (typeof window !== 'undefined') {
              window.location.href = '/dashboard'
            } else {
              router.replace('/dashboard')
            }
          }
        }
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const isSignUp = mode === 'signup'

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <img 
              src="/BIOSTACKR LOGO 2.png" 
              alt="Biostackr" 
              className="h-14 w-auto"
              style={{ width: '280px' }}
            />
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignUp ? 'Start sharing your health journey' : 'Welcome back to your health profile'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-200 sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {message}
              </div>
            )}

            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  First name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white sm:text-sm"
                    placeholder="Enter your first name"
                  />
                </div>
              </div>
            )}

            {isSignUp && (
              <div>
                <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700">
                  Referral Code <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="mt-1">
                  <input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white sm:text-sm"
                    placeholder="Enter referral code"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Optional. If you were given a referral code, enter it here.
                </p>
              </div>
            )}

            <div className={isSignUp ? '-mt-2' : ''}>
              {!isSignUp ? (
                <button
                  type="button"
                  className="text-sm text-gray-700 hover:underline"
                  onClick={() => setShowAccessCode(v => !v)}
                >
                  Have a promo or beta code?
                </button>
              ) : null}
              {showAccessCode && (
                <div className="mt-2">
                  <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700">
                    Promo / Beta Code <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="mt-1">
                    <input
                      id="accessCode"
                      name="accessCode"
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white sm:text-sm"
                      placeholder="Enter code (e.g., PH30)"
                      autoCapitalize="characters"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Product Hunt promo codes unlock Pro for a limited time. Beta codes unlock extended access.
                  </p>
                </div>
              )}
            </div>


            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
              {isSignUp && (
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </div>
                ) : (
                  isSignUp ? 'Create account' : 'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={
                  isSignUp
                    ? (`/login${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`)
                    : (`/signup${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`)
                }
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
              >
                {isSignUp ? 'Sign in instead' : 'Create an account'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
