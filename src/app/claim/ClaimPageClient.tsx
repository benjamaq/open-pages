'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cohortDashboardStudyPath, cohortProProductEntryPath } from '@/lib/cohortDashboardDeepLink'

type TokenState = 'loading' | 'invalid' | 'available' | 'claimed'

export default function ClaimPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = String(searchParams.get('token') || '').trim()

  const [tokenState, setTokenState] = useState<TokenState>('loading')
  const [sessionChecked, setSessionChecked] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const loginHref = `/login?redirect=${encodeURIComponent(`/claim?token=${encodeURIComponent(token)}`)}`
  const signupHref = `/signup?redirect=${encodeURIComponent(`/claim?token=${encodeURIComponent(token)}`)}`

  const refreshTokenStatus = useCallback(async () => {
    if (!token) {
      setTokenState('invalid')
      return
    }
    try {
      const res = await fetch(`/api/cohort/claim-reward?token=${encodeURIComponent(token)}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (res.status === 404) {
        setTokenState('invalid')
        return
      }
      if (!res.ok) {
        setTokenState('invalid')
        return
      }
      const j = (await res.json()) as { claimed?: boolean }
      setTokenState(j.claimed ? 'claimed' : 'available')
    } catch {
      setTokenState('invalid')
    }
  }, [token])

  useEffect(() => {
    void refreshTokenStatus()
  }, [refreshTokenStatus])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getSession()
        if (cancelled) return
        setLoggedIn(Boolean(data?.session?.user))
      } catch {
        if (!cancelled) setLoggedIn(false)
      } finally {
        if (!cancelled) setSessionChecked(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [success])

  async function onClaim() {
    setErr(null)
    setBusy(true)
    try {
      const res = await fetch('/api/cohort/claim-reward', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const j = (await res.json().catch(() => ({}))) as {
        error?: string
        ok?: boolean
        already_claimed?: boolean
      }
      if (!res.ok) {
        setErr(String(j.error || 'Could not claim reward'))
        setBusy(false)
        return
      }
      if (j.ok || j.already_claimed) {
        setSuccess(true)
      }
      try {
        window.dispatchEvent(new Event('dashboard:refresh'))
      } catch {
        /* ignore */
      }
    } catch {
      setErr('Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-lg font-semibold text-slate-900">Missing link</h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Use a valid claim link, or open your results page while signed in with your study account.
          </p>
          <Link
            href={cohortDashboardStudyPath()}
            className="mt-6 inline-block text-sm font-semibold text-[#C84B2F] underline"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (tokenState === 'loading' || !sessionChecked) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-600 text-sm">
        Loading…
      </div>
    )
  }

  if (tokenState === 'invalid') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-lg font-semibold text-slate-900">Link not valid</h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            This reward link isn&apos;t valid anymore. Try opening your results while signed in, or contact support if
            you need help.
          </p>
          <Link href="/dashboard" className="mt-6 inline-block text-sm font-semibold text-[#C84B2F] underline">
            Go to your dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-slate-900">Your reward has been applied</h1>
          <p className="mt-4 text-sm text-slate-700 leading-relaxed">
            You now have <strong>BioStackr Pro</strong> for <strong>3 months</strong> (added on top of any trial you
            already had).
          </p>
          <button
            type="button"
            onClick={() => router.push(cohortProProductEntryPath())}
            className="mt-8 w-full rounded-xl bg-[#C84B2F] px-4 py-3 text-sm font-semibold text-white hover:opacity-95"
          >
            Go to your stack
          </button>
        </div>
      </div>
    )
  }

  if (tokenState === 'claimed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-lg font-semibold text-slate-900">Already claimed</h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            This reward link has already been used. Each completion link works once.
          </p>
          <button
            type="button"
            onClick={() => router.push(cohortProProductEntryPath())}
            className="mt-6 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Go to your stack
          </button>
        </div>
      </div>
    )
  }

  // available
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900 text-center">Claim your study reward</h1>
          <p className="mt-3 text-sm text-slate-600 text-center leading-relaxed">
            Create your account or sign in to claim <strong>3 months of BioStackr Pro</strong> for completing your
            study.
          </p>
          <div className="mt-8 grid gap-3">
            <Link
              href={signupHref}
              className="flex justify-center rounded-xl bg-[#C84B2F] px-4 py-3 text-sm font-semibold text-white hover:opacity-95"
            >
              Create your account to claim your reward
            </Link>
            <Link
              href={loginHref}
              className="flex justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900 text-center">Claim your study reward</h1>
        <p className="mt-3 text-sm text-slate-600 text-center leading-relaxed">
          You&apos;ve earned <strong>3 months of BioStackr Pro</strong> for completing your study. This link works
          once.
        </p>
        {err ? <p className="mt-4 text-sm text-red-600 text-center">{err}</p> : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void onClaim()}
          className="mt-8 w-full rounded-xl bg-[#C84B2F] px-4 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
        >
          {busy ? 'Activating…' : 'Claim your Pro access'}
        </button>
      </div>
    </div>
  )
}
