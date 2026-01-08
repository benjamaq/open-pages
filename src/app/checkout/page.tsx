'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('yearly')
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      try {
        const { data, error } = await supabase.auth.getUser()
        if (cancelled) return
        if (error || !data?.user) {
          window.location.href = '/signup'
          return
        }
        setUserId(String(data.user.id))
        setEmail(String(data.user.email || ''))
      } catch {
        if (!cancelled) {
          window.location.href = '/signup'
          return
        }
      } finally {
        if (!cancelled) setAuthChecked(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  async function startCheckout() {
    try {
      setLoading(true)
      setError(null)
      if (!userId || !email) {
        setError('Sign in to continue')
        setLoading(false)
        return
      }
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'premium',
          period,
          userId,
          userEmail: email
        })
      })
      const j = await res.json()
      if (!res.ok || !j?.url) {
        setError(j?.error || 'Failed to start checkout')
        setLoading(false)
        return
      }
      window.location.href = j.url
    } catch (e: any) {
      setError(e?.message || 'Failed to start checkout')
      setLoading(false)
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600 bg-[#F6F5F3]">
        Loading…
      </div>
    )
  }

  // Not logged in → will be redirected to /signup above
  if (!userId) return null

  // Logged in → unlock flow
  return (
    <div className="min-h-screen bg-[#F6F5F3]">
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="bg-white border border-[#E4E1DC] rounded-2xl p-6">
          <h1 className="text-2xl font-semibold text-[#111111]">Unlock your results</h1>
          <p className="mt-2 text-sm text-[#4B5563]">
            See which supplements are working for you. Full verdicts with effect size, confidence, and savings.
          </p>

          <div className="mt-6 space-y-3">
            <label className="flex items-center justify-between rounded-xl border border-[#E4E1DC] bg-[#F6F5F3] p-4 cursor-pointer hover:bg-[#EEECE8]">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="billing"
                  className="h-4 w-4"
                  checked={period === 'yearly'}
                  onChange={() => setPeriod('yearly')}
                />
                <div>
                  <div className="text-sm font-medium text-[#111111]">$149/year</div>
                  <div className="text-xs text-[#6B7280]">Save 35% • Billed annually</div>
                </div>
              </div>
              <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">Recommended</span>
            </label>
            <label className="flex items-center justify-between rounded-xl border border-[#E4E1DC] bg-[#F6F5F3] p-4 cursor-pointer hover:bg-[#EEECE8]">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="billing"
                  className="h-4 w-4"
                  checked={period === 'monthly'}
                  onChange={() => setPeriod('monthly')}
                />
                <div>
                  <div className="text-sm font-medium text-[#111111]">$19/month</div>
                  <div className="text-xs text-[#6B7280]">Cancel anytime</div>
                </div>
              </div>
            </label>
          </div>

          <button
            onClick={startCheckout}
            disabled={loading}
            className="mt-6 w-full h-12 rounded-full bg-[#111111] text-white text-sm font-semibold hover:bg-black disabled:opacity-50"
          >
            {loading ? 'Redirecting…' : 'Continue to checkout'}
          </button>

          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

          <div className="mt-4 text-xs text-[#6B7280]">
            Payments handled by Stripe. You’ll be redirected to a secure checkout page.
          </div>
        </div>
      </div>
    </div>
  )
}

