'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '../../lib/supabase/client'

type BillingPeriod = 'monthly' | 'yearly'

export default function PaywallModal({
  open,
  onClose,
  defaultPeriod = 'yearly',
}: {
  open: boolean
  onClose: () => void
  defaultPeriod?: BillingPeriod
}) {
  const [period, setPeriod] = useState<BillingPeriod>(defaultPeriod)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCheckout = async () => {
    try {
      setLoading(true)
      setError(null)
      // Debug selection
      try { console.log('[PAYWALL] selected period:', period) } catch {}
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/signup'
        return
      }
      const returnPath = (() => {
        try {
          const { pathname, search } = window.location
          return `${pathname}${search || ''}`
        } catch { return '/dashboard' }
      })()
      const body = {
        plan: 'premium',
        period,
        userId: user.id,
        userEmail: user.email,
        returnPath
      }
      try { console.log('[PAYWALL] POST /api/billing/create-checkout-session body:', body) } catch {}
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const j = await res.json().catch(() => ({}))
      if (res.ok && j?.url) {
        try { console.log('[PAYWALL] redirecting to Stripe:', j.url) } catch {}
        window.location.href = j.url
      } else {
        setError(String(j?.error || 'Unable to start checkout. Please try again.'))
        setLoading(false)
      }
    } catch (e) {
      setError('Unable to start checkout. Please try again.')
      setLoading(false)
    }
  }

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative z-10 w-full max-w-[560px] rounded-xl bg-white p-6 sm:p-8 shadow-lg border border-gray-200"
        onClick={(e) => { e.stopPropagation() }}
      >
        <h3 className="text-xl sm:text-2xl font-semibold text-center">Unlock your results</h3>
        <p className="mt-2 text-sm text-gray-600 text-center">See which supplements are actually working for you.</p>

        <div className="mt-5 space-y-3">
          <label
            htmlFor="plan-yearly"
            onClick={() => setPeriod('yearly')}
            className="flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="plan-group"
                id="plan-yearly"
                className="h-4 w-4"
                checked={period === 'yearly'}
                onChange={() => setPeriod('yearly')}
              />
              <div>
                <div className="text-sm font-medium text-gray-900">$149/year</div>
                <div className="text-xs text-gray-600">$12.42/mo • Billed annually</div>
              </div>
            </div>
            <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">Recommended</span>
          </label>
          <label
            htmlFor="plan-monthly"
            onClick={() => setPeriod('monthly')}
            className="flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="plan-group"
                id="plan-monthly"
                className="h-4 w-4"
                checked={period === 'monthly'}
                onChange={() => setPeriod('monthly')}
              />
              <div>
                <div className="text-sm font-medium text-gray-900">$19/month</div>
                <div className="text-xs text-gray-600">Cancel anytime</div>
              </div>
            </div>
          </label>
        </div>

        <button
          onClick={startCheckout}
          disabled={loading}
          className="mt-6 w-full h-12 rounded-full bg-[#111111] text-white text-sm font-semibold hover:bg-black disabled:opacity-60"
        >
          {loading ? 'Redirecting…' : 'Continue to checkout'}
        </button>
        {error ? <div className="mt-3 text-xs text-rose-600 text-center">{error}</div> : null}
        <div className="mt-4 text-xs text-gray-600 text-center">
          Payments by Stripe. You can cancel anytime.
        </div>
      </div>
    </div>
  , typeof document !== 'undefined' ? document.body : (null as any))
}


